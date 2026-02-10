import React, { useState } from 'react';
import { TimeSeriesPoint } from '../types';

interface DataTableProps {
    data: TimeSeriesPoint[];
    frequency: string;
    onUpdate: (date: string, value?: number, notes?: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, frequency, onUpdate }) => {
    const [editingCell, setEditingCell] = useState<{ date: string, field: 'value' | 'notes' } | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const handleStartEdit = (point: TimeSeriesPoint, field: 'value' | 'notes') => {
        setEditingCell({ date: point.date, field });
        setEditValue(field === 'value' ? point.value.toString() : point.notes || '');
    };

    const handleSave = () => {
        if (!editingCell) return;

        if (editingCell.field === 'value') {
            const numVal = parseFloat(editValue);
            if (!isNaN(numVal)) {
                onUpdate(editingCell.date, numVal, undefined);
            }
        } else {
            onUpdate(editingCell.date, undefined, editValue);
        }
        setEditingCell(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setEditingCell(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800 capitalize">{frequency} Volume Detail</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((point) => (
                            <tr key={point.date} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {point.date}
                                </td>

                                <td
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-100"
                                    onClick={() => handleStartEdit(point, 'value')}
                                >
                                    {editingCell?.date === point.date && editingCell.field === 'value' ? (
                                        <input
                                            autoFocus
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleSave}
                                            onKeyDown={handleKeyDown}
                                            className="w-24 p-1 border border-blue-300 rounded shadow-sm"
                                        />
                                    ) : (
                                        point.value.toLocaleString()
                                    )}
                                </td>

                                <td
                                    className="px-6 py-4 text-sm text-gray-500 cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-100 max-w-md truncate"
                                    onClick={() => handleStartEdit(point, 'notes')}
                                >
                                    {editingCell?.date === point.date && editingCell.field === 'notes' ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleSave}
                                            onKeyDown={handleKeyDown}
                                            className="w-full p-1 border border-blue-300 rounded shadow-sm"
                                        />
                                    ) : (
                                        point.notes || <span className="text-gray-300 italic">Add note...</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {point.isAnomaly && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Anomaly
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
