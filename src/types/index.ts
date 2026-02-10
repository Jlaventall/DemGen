export interface TimeSettings {
    startDate: string;
    periodCount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    weeklyDay?: number; // 0=Sun, 1=Mon, ..., 6=Sat
    monthlyDay?: number; // 1-31
}

export interface DemandSettings {
    averageDaily: number;
    growthRate: number; // monthly %
    volatility: Volatility;
}

// Distribution Types
export interface Distribution {
    min: number;
    mode: number;
    max: number;
}

export type Volatility = 'none' | 'low' | 'medium' | 'high';

export interface BusinessPatterns {
    storeHours: '9-5' | '10-9' | '24-7';
    weekendBoost: number; // 0.5 = 50% boost
    monthlyPatterns: string[]; // ['end_surge', 'mid_slump']
}

export interface SeasonalityEvent {
    id: string;
    name: string;
    date: string; // MM-DD or YYYY-MM-DD
    duration: number; // days
    boost: number; // multiplier
}

export interface SeasonalitySettings {
    holidayMonths: number[]; // 1-12
    holidayStrength: number; // multiplier
    events: SeasonalityEvent[];
    // Mass Mode support
    monthlyWeights?: Record<number, number>;
}

export interface RealismSettings {
    anomalyRate: number; // 0-0.1
    includeStockouts: boolean;
    dataType: 'integer' | 'decimal';
}

export interface TimeSegment {
    id: string;
    startDate: string;
    endDate: string;
    name: string;
    // Overrides
    demand?: Partial<DemandSettings>;
    patterns?: Partial<BusinessPatterns>;
    realism?: Partial<RealismSettings>;
    trend?: number; // % change over the segment
}

export interface SeasonalityMarker {
    id: string;
    date: string;
    type: 'high' | 'low';
}

export interface DataOverride {
    value?: number;
    notes?: string;
    modifiedAt: number; // timestamp
    modifiedBy: string; // 'User'
}

export interface Distribution {
    min: number;
    mode: number;
    max: number;
}

export interface MassGenConfig {
    itemCount: number;
    time: TimeSettings; // Shared time settings
    demand: {
        averageDaily: Distribution;
        growthRate: Distribution;
        volatility: Distribution; // Map 0-1 to low/med/high or just use numeric? Let's use numeric 0-1 variability? 
        // User asked for "Distribution {low, mid, high}" for volatility. 
        // We can map 0=Low, 1=Med, 2=High if integer? Or continuous?
        // Let's assume continuous "Volatility Factor" 0.0 to 1.0
    };
    seasonality: {
        monthWeights: Record<number, Distribution>; // Key 1-12, Value is distribution of weights (e.g. 0.5 to 1.5)
    };
    // No segments for Mass Mode MVP?
}

export interface DemGenConfig {
    time: TimeSettings;
    demand: DemandSettings;
    patterns: BusinessPatterns;
    seasonality: SeasonalitySettings;
    realism: RealismSettings;
    segments: TimeSegment[];
    markers: SeasonalityMarker[];
    overrides: Record<string, DataOverride>; // Key is date string YYYY-MM-DD
}

export interface TimeSeriesPoint {
    date: string;
    value: number;
    notes?: string;
    isAnomaly?: boolean;
    isEdited?: boolean;
}

export const DEFAULT_CONFIG: DemGenConfig = {
    time: {
        startDate: '2024-01-01',
        periodCount: 365,
        frequency: 'daily',
    },
    demand: {
        averageDaily: 100,
        growthRate: 0,
        volatility: 'low',
    },
    patterns: {
        storeHours: '9-5',
        weekendBoost: 0,
        monthlyPatterns: [],
    },
    seasonality: {
        holidayMonths: [],
        holidayStrength: 1,
        events: [],
    },
    realism: {
        anomalyRate: 0,
        includeStockouts: false,
        dataType: 'integer',
    },
    segments: [],
    markers: [],
    overrides: {},
};
