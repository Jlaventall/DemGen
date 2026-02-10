import React from 'react';
import { TimeSegment } from '../types';
import { X, Save, Trash2 } from 'lucide-react';

interface SegmentEditorProps {
    segment: TimeSegment;
    onUpdate: (updatedSegment: TimeSegment) => void;
    onDelete: (segmentId: string) => void;
    onClose: () => void;
}

export const SegmentEditor: React.FC<SegmentEditorProps> = ({ segment, onUpdate, onDelete, onClose }) => {
    const updateDemand = (updates: any) => {
        onUpdate({ ...segment, demand: { ...segment.demand, ...updates } });
    };

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl p-4 overflow-y-auto transform transition-transform duration-300 ease-in-out z-50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Edit Segment</h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Range</label>
                    <div className="text-sm font-medium text-gray-900 border p-2 rounded bg-gray-50">
                        {segment.startDate} <span className="text-gray-400 mx-1">to</span> {segment.endDate}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Trend Override</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={segment.trend || 0}
                            onChange={(e) => onUpdate({ ...segment, trend: parseFloat(e.target.value) })}
                            className="flex-1 p-2 border rounded text-sm"
                        />
                        <span className="text-sm text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Growth/Decline over this specific period</p>
                </div>

                {/* Demand Overrides */}
                <div className="pt-4 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2 flex justify-between">
                        Avg Daily Units
                        <span className="text-blue-600 cursor-pointer text-xs normal-case" onClick={() => updateDemand({ averageDaily: undefined })}>Reset</span>
                    </label>
                    <input
                        type="number"
                        value={segment.demand?.averageDaily !== undefined ? segment.demand.averageDaily : ''}
                        placeholder="Inherit (Global)"
                        onChange={(e) => updateDemand({ averageDaily: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full p-2 border rounded text-sm"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Volatility Override</label>
                    <div className="flex rounded-md shadow-sm" role="group">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => updateDemand({ volatility: level })}
                                className={`px-3 py-1.5 text-xs font-medium border first:rounded-l-lg last:rounded-r-lg flex-1 capitalize
                            ${segment.demand?.volatility === level
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-8 border-t border-gray-200 flex justify-between">
                    <button
                        onClick={() => onDelete(segment.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
                    >
                        <Save size={16} />
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
};
