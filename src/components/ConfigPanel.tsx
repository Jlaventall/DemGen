import React from 'react';
import { DemGenConfig, TimeSettings, DemandSettings, BusinessPatterns, RealismSettings, SeasonalitySettings } from '../types';
import { TrendingUp, Briefcase, Activity, Sun } from 'lucide-react';
import { VerticalBar } from './VerticalBar';
import { TimeSettingsPanel } from './TimeSettingsPanel';

interface ConfigSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ title, icon, children }) => (
    <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
            {icon}
            <span>{title}</span>
        </div>
        <div className="space-y-4 pl-1">
            {children}
        </div>
    </div>
);

interface ConfigPanelProps {
    config: DemGenConfig;
    onChange: (newConfig: DemGenConfig) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {

    const updateTime = (newTimeSettings: TimeSettings) => {
        onChange({ ...config, time: newTimeSettings });
    };

    const updateDemand = (updates: Partial<DemandSettings>) => {
        onChange({ ...config, demand: { ...config.demand, ...updates } });
    };

    const updatePatterns = (updates: Partial<BusinessPatterns>) => {
        onChange({ ...config, patterns: { ...config.patterns, ...updates } });
    };

    const updateRealism = (updates: Partial<RealismSettings>) => {
        onChange({ ...config, realism: { ...config.realism, ...updates } });
    };

    const updateSeasonality = (updates: Partial<SeasonalitySettings>) => {
        onChange({ ...config, seasonality: { ...config.seasonality, ...updates } });
    };

    return (
        <div className="space-y-6">

            {/* Time Settings */}
            <TimeSettingsPanel settings={config.time} onChange={updateTime} />

            {/* Demand Profile */}
            <ConfigSection title="Demand Profile" icon={<TrendingUp size={18} />}>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">
                        Avg {config.time.frequency.charAt(0).toUpperCase() + config.time.frequency.slice(1)} Units ({config.demand.averageDaily})
                    </label>
                    <input
                        type="range"
                        min="10" max="1000" step="10"
                        value={config.demand.averageDaily}
                        onChange={(e) => updateDemand({ averageDaily: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">Growth Trend ({config.demand.growthRate}%)</label>
                    <input
                        type="range"
                        min="-10" max="20" step="1"
                        value={config.demand.growthRate}
                        onChange={(e) => updateDemand({ growthRate: parseInt(e.target.value) })}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>Decline</span>
                        <span>Stable</span>
                        <span>Growth</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">Volatility</label>
                    <div className="flex rounded-md shadow-sm" role="group">
                        {(['none', 'low', 'medium', 'high'] as const).map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => updateDemand({ volatility: level })}
                                className={`px-3 py-1.5 text-xs font-medium border first:rounded-l-lg last:rounded-r-lg flex-1 capitalize
                                    ${config.demand.volatility === level
                                        ? 'z-10 bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </ConfigSection>

            {/* Business Patterns */}
            <ConfigSection title="Business Patterns" icon={<Briefcase size={18} />}>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Weekend Boost ({Math.round(config.patterns.weekendBoost * 100)}%)</label>
                    <input
                        type="range"
                        min="0" max="1" step="0.1"
                        value={config.patterns.weekendBoost}
                        onChange={(e) => updatePatterns({ weekendBoost: parseFloat(e.target.value) })}
                        className="w-full"
                    />
                </div>
            </ConfigSection>

            {/* Seasonality */}
            <ConfigSection title="Seasonality" icon={<Sun size={18} />}>
                <div className="flex justify-between items-center mb-4 border-b pb-1">
                    <p className="text-xs text-gray-500">Monthly Weight Distribution (0.5x - 2.0x)</p>
                </div>

                <div className="flex justify-between items-end h-36 gap-1 pt-4 pb-2 select-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                        const weights = config.seasonality.monthlyWeights || {};
                        const val = weights[month] !== undefined ? weights[month] : 1.0;
                        const monthName = new Date(2023, month - 1, 1).toLocaleString('default', { month: 'narrow' });

                        return (
                            <div key={month} className="flex flex-col items-center gap-1 group h-full justify-end w-5">
                                {/* Tooltip / Value Indicator */}
                                <div className="text-[9px] font-bold text-gray-600 mb-1">
                                    {val.toFixed(1)}x
                                </div>

                                {/* Interactive Bar */}
                                <VerticalBar
                                    value={val}
                                    min={0}
                                    onChange={(newVal) => {
                                        const newWeights = { ...(config.seasonality.monthlyWeights || {}) };
                                        newWeights[month] = newVal;
                                        updateSeasonality({ monthlyWeights: newWeights });
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
            </ConfigSection>

            {/* Realism */}
            <ConfigSection title="Realism" icon={<Activity size={18} />}>
                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Include Stockouts</label>
                    <input
                        type="checkbox"
                        checked={config.realism.includeStockouts}
                        onChange={(e) => updateRealism({ includeStockouts: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <label className="text-sm text-gray-700">Anomaly Rate ({Math.round(config.realism.anomalyRate * 100)}%)</label>
                </div>
                <input
                    type="range"
                    min="0" max="0.1" step="0.01"
                    value={config.realism.anomalyRate}
                    onChange={(e) => updateRealism({ anomalyRate: parseFloat(e.target.value) })}
                    className="w-full"
                />
            </ConfigSection>

        </div>
    );
};
