import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    ReferenceLine
} from 'recharts';
import { TimeSeriesPoint, TimeSegment, SeasonalityMarker } from '../types';
import { format, parseISO } from 'date-fns';

interface DemandChartProps {
    data: TimeSeriesPoint[];
    segments: TimeSegment[];
    markers: SeasonalityMarker[];
    onRangeSelect: (start: string, end: string) => void;
    onSegmentClick: (segmentId: string) => void;
    onPointClick: (date: string) => void;
    onMarkerClick: (markerId: string) => void;
}

export const DemandChart: React.FC<DemandChartProps> = ({ data, segments, markers, onRangeSelect, onSegmentClick, onPointClick, onMarkerClick }) => {
    const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
    const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

    const handleMouseDown = (e: any) => {
        if (e && e.activeLabel) {
            setRefAreaLeft(e.activeLabel);
        }
    };

    const handleMouseMove = (e: any) => {
        if (refAreaLeft && e && e.activeLabel) {
            setRefAreaRight(e.activeLabel);
        }
    };

    const handleMouseUp = () => {
        if (refAreaLeft) {
            if (refAreaRight && refAreaLeft !== refAreaRight) {
                const [start, end] = refAreaLeft < refAreaRight
                    ? [refAreaLeft, refAreaRight]
                    : [refAreaRight, refAreaLeft];
                onRangeSelect(start, end);
            } else {
                // It's a click
                onPointClick(refAreaLeft);
            }
        }
        setRefAreaLeft(null);
        setRefAreaRight(null);
    };

    // Calculate Stats
    const totalDemand = Math.round(data.reduce((sum, p) => sum + p.value, 0));
    const meanDemand = Math.round(totalDemand / (data.length || 1));
    const stdDev = Math.round(Math.sqrt(data.reduce((sum, p) => sum + Math.pow(p.value - meanDemand, 2), 0) / (data.length || 1)));

    // Custom Dot Component
    const CustomizedDot = (props: any) => {
        const { cx, cy, payload } = props;

        if (payload.isEdited) {
            return (
                <circle cx={cx} cy={cy} r={5} fill="#1E40AF" stroke="#1E40AF" strokeWidth={1} />
            );
        }

        return (
            <circle cx={cx} cy={cy} r={3} fill="white" stroke="#60A5FA" strokeWidth={2} />
        );
    };

    return (
        <div className="flex flex-col h-[500px] w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 select-none relative">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-800">Demand Projection</h3>

                {/* Stats Overlay */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-right shadow-sm z-10">
                    <div className="text-2xl font-bold text-blue-900">{totalDemand.toLocaleString()}</div>
                    <div className="text-xs text-blue-600 uppercase font-semibold tracking-wider">Total Demand</div>
                    <div className="flex gap-3 justify-end mt-2 text-xs text-gray-600">
                        <span>Mean: <strong>{meanDemand.toLocaleString()}</strong></span>
                        <span>StdDev: <strong>{stdDev.toLocaleString()}</strong></span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                            minTickGap={30}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            labelFormatter={(label) => format(parseISO(label), 'MMM d, yyyy')}
                        />
                        {segments.map(seg => (
                            <ReferenceArea
                                key={seg.id}
                                x1={seg.startDate}
                                x2={seg.endDate}
                                fill="#3B82F6"
                                fillOpacity={0.1}
                                onClick={() => onSegmentClick(seg.id)}
                                className="cursor-pointer hover:fill-opacity-20 transition-opacity"
                            />
                        ))}
                        {markers.map(marker => (
                            <ReferenceLine
                                key={marker.id}
                                x={marker.date}
                                stroke={marker.type === 'high' ? '#10B981' : '#EF4444'}
                                strokeDasharray="3 3"
                                label={{
                                    value: marker.type === 'high' ? 'H' : 'L',
                                    position: 'top',
                                    fill: marker.type === 'high' ? '#10B981' : '#EF4444',
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    onClick: () => onMarkerClick(marker.id)
                                }}
                            />
                        ))}
                        {refAreaLeft && refAreaRight && (
                            <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#9CA3AF" fillOpacity={0.3} />
                        )}
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={<CustomizedDot />}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
