import React from 'react';
import { MassGenConfig, Distribution } from '../types';
import { Settings, BarChart2, Layers } from 'lucide-react';
import { VerticalBar } from './VerticalBar';
import { TimeSettingsPanel } from './TimeSettingsPanel';

interface MassConfigPanelProps {
    config: MassGenConfig;
    onChange: (config: MassGenConfig) => void;
    onSync?: () => void;
}

const DistributionInput = ({ label, value, onChange, min = 0, max = 1000, step = 1 }: {
    label: string,
    value: Distribution,
    onChange: (d: Distribution) => void,
    min?: number,
    max?: number,
    step?: number
}) => {
    return (
        <div className="mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{label}</span>
                <span className="text-xs text-gray-500">
                    [{value.min}, {value.mode}, {value.max}]
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="text-[10px] text-gray-400">Min</label>
                    <input
                        type="number" min={min} max={max} step={step}
                        value={value.min}
                        onChange={(e) => onChange({ ...value, min: parseFloat(e.target.value) })}
                        className="w-full text-xs p-1 border rounded"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400">Mode</label>
                    <input
                        type="number" min={min} max={max} step={step}
                        value={value.mode}
                        onChange={(e) => onChange({ ...value, mode: parseFloat(e.target.value) })}
                        className="w-full text-xs p-1 border rounded"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400">Max</label>
                    <input
                        type="number" min={min} max={max} step={step}
                        value={value.max}
                        onChange={(e) => onChange({ ...value, max: parseFloat(e.target.value) })}
                        className="w-full text-xs p-1 border rounded"
                    />
                </div>
            </div>
        </div>
    );
};


export const MassConfigPanel: React.FC<MassConfigPanelProps> = ({ config, onChange, onSync }) => {

    const updateTime = (newTime: any) => {
        onChange({ ...config, time: newTime });
    };

    const updateDemand = (key: keyof MassGenConfig['demand'], val: Distribution) => {
        onChange({ ...config, demand: { ...config.demand, [key]: val } });
    };

    const updateSeasonality = (month: number, val: Distribution) => {
        onChange({
            ...config,
            seasonality: {
                ...config.seasonality,
                monthWeights: { ...config.seasonality.monthWeights, [month]: val }
            }
        });
    };

    return (
        <div className="space-y-6 p-1">
            {/* Time Settings */}
            <TimeSettingsPanel settings={config.time} onChange={updateTime} />

            {/* Scale */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-gray-800 font-semibold border-b pb-1">
                    <Layers size={16} /> Scale
                </div>
                <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1"># of Items to Generate</label>
                    <input type="number" value={config.itemCount} min="1" max="1000"
                        onChange={e => onChange({ ...config, itemCount: parseInt(e.target.value) })}
                        className="w-full text-sm border-gray-300 rounded font-bold"
                    />
                </div>

                {/* Sync Button */}
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-2">Initialize from Single Mode settings?</p>
                    <button
                        onClick={onSync}
                        className="w-full py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center gap-1"
                    >
                        <Layers size={12} /> Copy from Single Mode
                    </button>
                </div>
            </div>

            {/* Demand Distributions */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-gray-800 font-semibold border-b pb-1">
                    <BarChart2 size={16} /> Demand Distributions
                </div>

                <DistributionInput
                    label="Avg Units (Distribution)"
                    value={config.demand.averageDaily}
                    onChange={v => updateDemand('averageDaily', v)}
                    min={0} max={5000}
                />

                <DistributionInput
                    label="Growth Trend % (Distribution)"
                    value={config.demand.growthRate}
                    onChange={v => updateDemand('growthRate', v)}
                    min={-50} max={50}
                />

                <DistributionInput
                    label="Volatility (0=None, 1=Low, 2=Med, 3=High)"
                    value={config.demand.volatility}
                    onChange={v => updateDemand('volatility', v)}
                    min={0} max={3} step={0.1}
                />
            </div>

            {/* Seasonality Weights (Equalizer) */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4 border-b pb-1">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Settings size={16} /> Seasonality
                    </h3>
                    <div className="text-[10px] text-gray-500">Mode Multiplier (0.5x - 2.0x)</div>
                </div>

                <div className="flex justify-between items-end h-36 gap-1 pt-4 pb-2 select-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                        const dist = config.seasonality.monthWeights[month] || { min: 1, mode: 1, max: 1 };
                        const monthName = new Date(2023, month - 1, 1).toLocaleString('default', { month: 'narrow' });

                        return (
                            <div key={month} className="flex flex-col items-center gap-1 group h-full justify-end w-5">
                                {/* Tooltip / Value Indicator */}
                                <div className="text-[9px] font-bold text-gray-600 mb-1">
                                    {dist.mode.toFixed(1)}x
                                </div>

                                {/* Interactive Bar */}
                                <VerticalBar
                                    value={dist.mode}
                                    min={0}
                                    onChange={(val) => {
                                        updateSeasonality(month, {
                                            min: Number((val * 0.9).toFixed(2)),
                                            mode: val,
                                            max: Number((val * 1.1).toFixed(2))
                                        });
                                    }}
                                />

                                <span className="text-[9px] text-gray-500 font-medium">{monthName}</span>
                            </div>
                        );
                    })}
                </div>
                <p className="text-[9px] text-gray-400 mt-2 text-center">
                    Click or drag bars to adjust seasonal weight.
                </p>
            </div>
        </div>
    );
};
