import React from 'react';
import { TimeSettings } from '../types';
import { Calendar } from 'lucide-react';

interface TimeSettingsPanelProps {
    settings: TimeSettings;
    onChange: (settings: TimeSettings) => void;
}

export const TimeSettingsPanel: React.FC<TimeSettingsPanelProps> = ({ settings, onChange }) => {

    const update = (updates: Partial<TimeSettings>) => {
        onChange({ ...settings, ...updates });
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium border-b pb-1">
                <Calendar size={18} />
                <span>Time Settings</span>
            </div>
            <div className="space-y-4 pl-1">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={settings.startDate}
                            onChange={(e) => update({ startDate: e.target.value })}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Duration (Periods)</label>
                        <input
                            type="number"
                            min="1"
                            value={settings.periodCount}
                            onChange={(e) => update({ periodCount: parseInt(e.target.value) || 1 })}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                    <div className="flex flex-wrap gap-1">
                        {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((freq) => (
                            <button
                                key={freq}
                                type="button"
                                onClick={() => update({ frequency: freq })}
                                className={`px-3 py-1.5 text-xs font-medium border rounded-md capitalize
                                    ${settings.frequency === freq
                                        ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {freq}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Weekly Alignment */}
                {settings.frequency === 'weekly' && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Align to Day</label>
                        <div className="flex rounded-md shadow-sm" role="group">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => update({ weeklyDay: index })}
                                    className={`flex-1 py-1.5 text-[10px] font-medium border first:rounded-l-md last:rounded-r-md
                                        ${settings.weeklyDay === index
                                            ? 'bg-blue-100 text-blue-700 border-blue-200 z-10'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Monthly Alignment */}
                {settings.frequency === 'monthly' && (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Day of Month</label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Every</span>
                            <input
                                type="number"
                                min="1" max="31"
                                value={settings.monthlyDay || 1}
                                onChange={(e) => update({ monthlyDay: parseInt(e.target.value) })}
                                className="w-16 text-sm border-gray-300 rounded-md shadow-sm"
                            />
                            <span className="text-sm text-gray-600">of month</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
