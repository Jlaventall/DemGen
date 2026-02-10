import { useState, useMemo } from 'react';
import { MainLayout } from './components/MainLayout';
import { ConfigPanel } from './components/ConfigPanel';
import { DemandChart } from './components/DemandChart';
import { DataTable } from './components/DataTable';
import { SegmentEditor } from './components/SegmentEditor';
import { DEFAULT_CONFIG, DemGenConfig, TimeSegment } from './types';
import { generateTimeSeries } from './utils/engine';
import { Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { MassGenConfig } from './types';
import { MassConfigPanel } from './components/MassConfigPanel';
import { generateMassData, GeneratedItem } from './utils/massEngine';

// Default Mass Config
const DEFAULT_MASS_CONFIG: MassGenConfig = {
    itemCount: 10,
    time: { ...DEFAULT_CONFIG.time },
    demand: {
        averageDaily: { min: 50, mode: 100, max: 200 },
        growthRate: { min: -5, mode: 0, max: 10 },
        volatility: { min: 1, mode: 1.5, max: 2 } // 1-3 scale
    },
    seasonality: {
        monthWeights: {} // Will default to 1,1,1
    }
};

function App() {
    const [mode, setMode] = useState<'single' | 'mass'>('single');
    const [config, setConfig] = useState<DemGenConfig>(DEFAULT_CONFIG);
    const [massConfig, setMassConfig] = useState<MassGenConfig>(DEFAULT_MASS_CONFIG);
    const [massData, setMassData] = useState<GeneratedItem[]>([]);

    // ... Single Mode State ...
    const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
    const [markerMode, setMarkerMode] = useState<'high' | 'low' | null>(null);

    // Memoize SINGLE generation
    const data = useMemo(() => {
        if (mode === 'single') return generateTimeSeries(config);
        return [];
    }, [config, mode]);

    // Prepare Mass Chart Data
    const massChartData = useMemo(() => {
        if (massData.length === 0) return [];
        // Assuming all items have same dates
        return massData[0].data.map((point, i) => {
            const entry: any = { date: point.date };
            massData.forEach(item => {
                entry[item.name] = item.data[i]?.value;
            });
            return entry;
        });
    }, [massData]);

    const handleExport = (format: 'csv' | 'json') => {
        if (mode === 'single') {
            if (format === 'json') {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `demgen_data_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                const headers = ['Date', 'Value', 'Notes', 'IsAnomaly'];
                const rows = data.map(pt => [
                    pt.date,
                    pt.value,
                    pt.notes ? `"${pt.notes}"` : '',
                    pt.isAnomaly ? 'true' : 'false'
                ].join(','));
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `demgen_data_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } else {
            // Mass Export
            if (massData.length === 0) return;

            if (format === 'json') {
                // Hierarchical JSON Format
                const exportObj = {
                    generationParameters: massConfig,
                    generatedAt: new Date().toISOString(),
                    items: massData.map(item => ({
                        id: item.id,
                        name: item.name,
                        parameters: item.config,
                        // Data as Dictionary { Date: Value }
                        data: item.data.reduce((acc, point) => {
                            acc[point.date] = point.value;
                            return acc;
                        }, {} as Record<string, number>)
                    }))
                };

                const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `demgen_mass_data_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Wide Format CSV
                const dates = massData[0].data.map(d => d.date);
                const headers = ['Date', ...massData.map(item => item.name)];

                const rows = dates.map((date, idx) => {
                    const row = [date];
                    massData.forEach(item => {
                        const val = item.data[idx]?.value || 0;
                        row.push(val.toString());
                    });
                    return row.join(',');
                });

                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `demgen_mass_data_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            }
        }
    };

    const handleSyncFromSingle = () => {
        // Sync Single Config to Mass Config
        // Map Single Volatility to Mass Distribution (Mode)
        let volMode = 1; // low
        if (config.demand.volatility === 'medium') volMode = 2;
        if (config.demand.volatility === 'high') volMode = 3;
        if (config.demand.volatility === 'none') volMode = 0;

        // Map Monthly Weights
        const monthWeights: Record<number, any> = {};
        if (config.seasonality.monthlyWeights) {
            Object.entries(config.seasonality.monthlyWeights).forEach(([m, val]) => {
                const numVal = typeof val === 'number' ? val : 1.0;
                monthWeights[parseInt(m)] = { min: numVal, mode: numVal, max: numVal };
            });
        }

        setMassConfig(prev => ({
            ...prev,
            time: JSON.parse(JSON.stringify(config.time)), // Deep copy time settings
            demand: {
                averageDaily: {
                    min: Math.round(config.demand.averageDaily * 0.8),
                    mode: config.demand.averageDaily,
                    max: Math.round(config.demand.averageDaily * 1.2)
                },
                growthRate: {
                    min: config.demand.growthRate - 2,
                    mode: config.demand.growthRate,
                    max: config.demand.growthRate + 2
                },
                volatility: {
                    min: Math.max(0, volMode - 0.5),
                    mode: volMode,
                    max: volMode + 0.5
                }
            },
            seasonality: {
                monthWeights: monthWeights
            }
        }));
    };

    const handleRangeSelect = (start: string, end: string) => {
        if (markerMode) return;

        const newSegment: TimeSegment = {
            id: uuidv4(),
            startDate: start,
            endDate: end,
            name: 'New Segment',
            demand: {}, // Inherit
            trend: 0
        };
        setConfig(prev => ({
            ...prev,
            segments: [...prev.segments, newSegment]
        }));
        setSelectedSegmentId(newSegment.id);
    };

    const handlePointClick = (date: string) => {
        if (!markerMode) return;

        setConfig(prev => ({
            ...prev,
            markers: [
                ...prev.markers,
                { id: uuidv4(), date, type: markerMode }
            ]
        }));
    };

    const handleMarkerClick = (id: string) => {
        setConfig(prev => ({
            ...prev,
            markers: prev.markers.filter(m => m.id !== id)
        }));
    };

    const handleSegmentUpdate = (updatedSegment: TimeSegment) => {
        setConfig(prev => ({
            ...prev,
            segments: prev.segments.map(s => s.id === updatedSegment.id ? updatedSegment : s)
        }));
    };

    const handleSegmentDelete = (id: string) => {
        setConfig(prev => ({
            ...prev,
            segments: prev.segments.filter(s => s.id !== id)
        }));
        setSelectedSegmentId(null);
    };

    const selectedSegment = config.segments.find(s => s.id === selectedSegmentId);

    const handleDataUpdate = (date: string, value?: number, notes?: string) => {
        setConfig(prev => {
            const currentOverride = prev.overrides[date] || {};
            const newOverride = {
                ...currentOverride,
                modifiedAt: Date.now(),
                modifiedBy: 'User'
            };

            if (value !== undefined) newOverride.value = value;
            if (notes !== undefined) newOverride.notes = notes;

            return {
                ...prev,
                overrides: {
                    ...prev.overrides,
                    [date]: newOverride
                }
            };
        });
    };

    const handleMassGenerate = () => {
        const items = generateMassData(massConfig);
        setMassData(items);
    };

    return (
        <MainLayout
            sidebar={
                mode === 'single' ? (
                    <ConfigPanel config={config} onChange={setConfig} />
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <h2 className="font-bold text-lg">Mass Generation</h2>
                            <p className="text-xs text-gray-500">Configure distributions</p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <MassConfigPanel
                                config={massConfig}
                                onChange={setMassConfig}
                                onSync={handleSyncFromSingle}
                            />
                        </div>
                        <div className="p-4 border-t bg-gray-50">
                            <button
                                onClick={handleMassGenerate}
                                className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
                            >
                                Generate {massConfig.itemCount} Items
                            </button>
                        </div>
                    </div>
                )
            }
        >
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="flex items-center gap-4">
                    {/* Mode Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('single')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'single' ? 'bg-white shadow text-blue-700' : 'text-gray-600'}`}
                        >
                            Single Mode
                        </button>
                        <button
                            onClick={() => setMode('mass')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'mass' ? 'bg-white shadow text-blue-700' : 'text-gray-600'}`}
                        >
                            Mass Mode
                        </button>
                    </div>

                    {mode === 'single' && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 ml-4">Prediction Overview</h2>
                            <p className="text-xs text-gray-500 ml-4 hidden md:block">
                                Generating {data.length} data points starting {config.time.startDate}
                            </p>
                        </div>
                    )}
                </div>

                {mode === 'single' && (
                    <div className="flex gap-2 items-center">
                        {/* Marker Controls */}
                        <div className="flex bg-gray-100 p-1 rounded-md mr-4">
                            <button
                                onClick={() => setMarkerMode(markerMode === 'high' ? null : 'high')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${markerMode === 'high'
                                    ? 'bg-green-100 text-green-700 shadow-sm border border-green-200'
                                    : 'text-gray-600 hover:bg-white'
                                    }`}
                            >
                                + High Mark
                            </button>
                            <button
                                onClick={() => setMarkerMode(markerMode === 'low' ? null : 'low')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${markerMode === 'low'
                                    ? 'bg-red-100 text-red-700 shadow-sm border border-red-200'
                                    : 'text-gray-600 hover:bg-white'
                                    }`}
                            >
                                + Low Mark
                            </button>
                        </div>

                        <button
                            onClick={() => setConfig(DEFAULT_CONFIG)}
                            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300"
                        >
                            Reset Defaults
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                )}
            </div>

            {mode === 'single' ? (
                <>
                    <div className="relative">
                        <DemandChart
                            data={data}
                            segments={config.segments}
                            markers={config.markers}
                            onRangeSelect={handleRangeSelect}
                            onSegmentClick={setSelectedSegmentId}
                            onPointClick={handlePointClick}
                            onMarkerClick={handleMarkerClick}
                        />

                        {selectedSegment && (
                            <SegmentEditor
                                segment={selectedSegment}
                                onUpdate={handleSegmentUpdate}
                                onDelete={handleSegmentDelete}
                                onClose={() => setSelectedSegmentId(null)}
                            />
                        )}
                    </div>

                    <div className="mt-6">
                        <DataTable
                            data={data}
                            frequency={config.time.frequency}
                            onUpdate={handleDataUpdate}
                        />
                    </div>
                </>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    {massData.length === 0 ? (
                        <div className="py-20 text-gray-500">
                            Configure distributions on the left and click "Generate".
                        </div>
                    ) : (
                        <div className="text-left">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Generated {massData.length} Items</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="flex items-center gap-2 text-blue-600 text-sm hover:underline border px-3 py-1 rounded"
                                    >
                                        <Download size={14} />
                                        Export All (CSV)
                                    </button>
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="flex items-center gap-2 text-blue-600 text-sm hover:underline border px-3 py-1 rounded"
                                    >
                                        <Download size={14} />
                                        Export All (JSON)
                                    </button>
                                </div>
                            </div>

                            {/* Mass Chart */}
                            <div className="mb-6 h-80 w-full border rounded-lg p-4 bg-gray-50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={massChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis />
                                        <Tooltip labelStyle={{ color: 'black' }} />
                                        {/* Render top 20 items to avoid DOM overload? Or all? User said "all generated series" */}
                                        {/* Let's render all but with thin lines. Random colors? */}
                                        {massData.slice(0, 50).map((item, i) => (
                                            <Line
                                                key={item.id}
                                                type="monotone"
                                                dataKey={item.name}
                                                stroke={`hsl(${(i * 137.5) % 360}, 70%, 50%)`}
                                                dot={false}
                                                strokeWidth={1}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                                {massData.length > 50 && (
                                    <p className="text-xs text-gray-400 mt-2 text-center">Showing first 50 items to prevent lag.</p>
                                )}
                            </div>

                            <div className="max-h-[600px] overflow-auto border rounded-lg">
                                <table className="min-w-full text-sm divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="p-3 text-left font-medium text-gray-500">Item</th>
                                            <th className="p-3 text-left font-medium text-gray-500">Avg Units</th>
                                            <th className="p-3 text-left font-medium text-gray-500">Growth %</th>
                                            <th className="p-3 text-left font-medium text-gray-500">Volatility</th>
                                            <th className="p-3 text-left font-medium text-gray-500">First Point</th>
                                            <th className="p-3 text-left font-medium text-gray-500">Last Point</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {massData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium text-gray-900">{item.name}</td>
                                                <td className="p-3 text-gray-700">{item.config.demand.averageDaily}</td>
                                                <td className="p-3 text-gray-700">{item.config.demand.growthRate}%</td>
                                                <td className="p-3 capitalize text-gray-700">{item.config.demand.volatility}</td>
                                                <td className="p-3 text-gray-700">{Math.round(item.data[0]?.value || 0)}</td>
                                                <td className="p-3 text-gray-700">{Math.round(item.data[item.data.length - 1]?.value || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </MainLayout>
    );
}

export default App;
