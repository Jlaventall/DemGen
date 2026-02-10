import { addDays, addWeeks, addMonths, addQuarters, addYears, format, getDay, getDaysInMonth, isWithinInterval, parseISO, differenceInDays, setDate } from 'date-fns';
import { DemGenConfig, TimeSeriesPoint, TimeSegment } from '../types';

/**
 * Generates a date range based on configuration.
 * Uses periodCount and frequency alignment.
 */
export const generateDateRange = (config: DemGenConfig): Date[] => {
    const { startDate, periodCount, frequency, weeklyDay, monthlyDay } = config.time;
    let current = parseISO(startDate);
    const dates: Date[] = [];

    // Align start date if necessary
    if (frequency === 'weekly' && weeklyDay !== undefined) {
        // Move to next occurrence of that day
        // 0=Sun, 1=Mon...
        const currentDay = getDay(current);
        let diff = weeklyDay - currentDay;
        if (diff < 0) diff += 7;
        current = addDays(current, diff);
    } else if (frequency === 'monthly' && monthlyDay !== undefined) {
        // Try to set day of month.
        // If we are past that day in current month, move to next month.
        let targetDate = setDate(current, monthlyDay);
        if (targetDate < current) { // If setting date moved it to past (e.g. want 5th but it's 15th, setDate(5) stays in same month but goes back)
            // Actually setDate(5) checks if 5th of this month is < current.
            targetDate = addMonths(targetDate, 1);
        }
        current = targetDate;
    }

    // Generate Periods
    for (let i = 0; i < periodCount; i++) {
        dates.push(current);
        switch (frequency) {
            case 'weekly': current = addWeeks(current, 1); break;
            case 'monthly': current = addMonths(current, 1); break;
            case 'quarterly': current = addQuarters(current, 1); break;
            case 'yearly': current = addYears(current, 1); break;
            case 'daily': default: current = addDays(current, 1); break;
        }
    }

    return dates;
};

/**
 * Helper to get the effective configuration for a specific date, merging global config with segment overrides.
 */
const getEffectiveConfig = (date: Date, config: DemGenConfig): {
    demand: DemGenConfig['demand'],
    patterns: DemGenConfig['patterns'],
    realism: DemGenConfig['realism'],
    segment?: TimeSegment
} => {
    // Find active segment (last one wins if overlapping, for simplicity)
    const activeSegment = config.segments.find(seg =>
        isWithinInterval(date, { start: parseISO(seg.startDate), end: parseISO(seg.endDate) })
    );

    if (activeSegment) {
        return {
            demand: { ...config.demand, ...(activeSegment.demand || {}) },
            patterns: { ...config.patterns, ...(activeSegment.patterns || {}) },
            realism: { ...config.realism, ...(activeSegment.realism || {}) },
            segment: activeSegment
        };
    }

    return {
        demand: config.demand,
        patterns: config.patterns,
        realism: config.realism
    };
};

/**
 * Applies volatility to a base value.
 */
const applyVolatility = (value: number, volatility: 'low' | 'medium' | 'high' | 'none'): number => {
    if (volatility === 'none') return value;
    let range = 0.1;
    if (volatility === 'medium') range = 0.3;
    if (volatility === 'high') range = 0.6;
    const randomFactor = 1 - range + Math.random() * (range * 2);
    return value * randomFactor;
};

/**
 * Generates the base series with average demand and volatility.
 */
export const generateBaseSeries = (dates: Date[], config: DemGenConfig): TimeSeriesPoint[] => {
    return dates.map(date => {
        const { demand } = getEffectiveConfig(date, config);
        const baseValue = demand.averageDaily;
        const value = applyVolatility(baseValue, demand.volatility);
        return {
            date: format(date, 'yyyy-MM-dd'),
            value,
        };
    });
};

/**
 * Applies a growth trend (Total Change % over duration).
 * If trend is +10%, the last point will be 10% higher than the first point (linear).
 */
export const applyGrowthTrend = (series: TimeSeriesPoint[], config: DemGenConfig): TimeSeriesPoint[] => {
    // Global Trend
    const annualGrowthRate = config.demand.growthRate; // Annual % change 
    if (series.length < 2) return series;

    const startDate = parseISO(series[0].date);
    const endDate = parseISO(series[series.length - 1].date);
    const totalDays = differenceInDays(endDate, startDate) || 1;
    const durationInYears = totalDays / 365;

    // Total change percent over the entire period if using simple annualized growth
    const totalGrowthPercent = annualGrowthRate * durationInYears;

    return series.map((point) => {
        let value = point.value;
        const date = parseISO(point.date);
        const { segment } = getEffectiveConfig(date, config);

        // Determine active trend and duration
        let activeTotalGrowth = totalGrowthPercent;
        let progress = 0;

        if (segment && segment.trend !== undefined) {
            // For segments, is the trend input Annualized or Total?
            // User said "Annualized linear growth weight... from first to last".
            // If a segment is 1 month, and I put 10%, do they mean 10% per year? 
            // Let's assume Segment Trend is ALSO Annualized for consistency.
            const segRate = segment.trend;
            const segStart = parseISO(segment.startDate);
            const segEnd = parseISO(segment.endDate);
            const segDuration = differenceInDays(segEnd, segStart) || 1;
            const segYears = segDuration / 365;
            activeTotalGrowth = segRate * segYears;

            const daysSince = differenceInDays(date, segStart);
            progress = Math.min(Math.max(daysSince / segDuration, 0), 1);
        } else {
            const daysSinceStart = differenceInDays(date, startDate);
            progress = Math.min(Math.max(daysSinceStart / totalDays, 0), 1);
        }

        const factor = 1 + (activeTotalGrowth / 100) * progress;
        value *= factor;

        return { ...point, value };
    });
};

/**
 * Applies manual overrides.
 */
export const applyOverrides = (series: TimeSeriesPoint[], config: DemGenConfig): TimeSeriesPoint[] => {
    return series.map(point => {
        const override = config.overrides[point.date];
        if (override) {
            let notes = point.notes || '';
            let value = point.value;

            if (override.value !== undefined) {
                value = override.value;
                const editNote = `-- Edited by ${override.modifiedBy} on ${new Date(override.modifiedAt).toLocaleString()}`;

                // If notes already contains an edit note, replace it? Or append?
                // Simple append for now.
                // Or checking if override.notes is present.
                if (!notes.includes('-- Edited by')) {
                    notes = notes ? `${notes} ${editNote}` : editNote;
                }
            }

            if (override.notes !== undefined) {
                notes = override.notes;
            }

            return { ...point, value, notes, isEdited: true };
        }
        return point;
    });
};

/**
 * Applies business patterns.
 */
export const applyBusinessPatterns = (series: TimeSeriesPoint[], config: DemGenConfig): TimeSeriesPoint[] => {
    return series.map(point => {
        const date = parseISO(point.date);
        const { patterns } = getEffectiveConfig(date, config);
        const dayOfWeek = getDay(date);
        let value = point.value;
        let notes = point.notes;

        // Weekend boost
        if ((dayOfWeek === 0 || dayOfWeek === 6) && patterns.weekendBoost > 0) {
            value *= (1 + patterns.weekendBoost);
        }

        // Monthly patterns (using global config for now as they are boolean flags, but could be overridden)
        // If patterns are overridden in segment, we use those.
        const dayOfMonth = date.getDate();
        const daysInMonth = getDaysInMonth(date);

        if (patterns.monthlyPatterns.includes('end_surge') && dayOfMonth > daysInMonth - 3) {
            value *= 1.3;
            notes = notes ? `${notes}, End Surge` : 'End Surge';
        }

        if (patterns.monthlyPatterns.includes('mid_slump') && dayOfMonth >= 14 && dayOfMonth <= 16) {
            value *= 0.7;
            notes = notes ? `${notes}, Mid Slump` : 'Mid Slump';
        }

        return { ...point, value, notes };
    });
};

/**
 * Applies seasonality (holidays) and custom events.
 */
export const applySeasonality = (series: TimeSeriesPoint[], config: DemGenConfig): TimeSeriesPoint[] => {
    return series.map(point => {
        const date = parseISO(point.date);
        const month = date.getMonth() + 1;
        let value = point.value;
        let notes = point.notes;

        // 1. Monthly Weights (Equalizer) - Primary Method
        // If monthlyWeights exists and has a value for this month, use it.
        // Falls back to 1.0 if not defined but object exists.
        if (config.seasonality.monthlyWeights && config.seasonality.monthlyWeights[month] !== undefined) {
            value *= config.seasonality.monthlyWeights[month];
        } else {
            // 2. Legacy Holiday Support (Binary) - Fallback
            if (!config.seasonality.monthlyWeights && config.seasonality.holidayMonths.includes(month)) {
                value *= config.seasonality.holidayStrength;
            }
        }

        if (config.seasonality.events) {
            config.seasonality.events.forEach(event => {
                const eventStart = parseISO(event.date);
                const eventEnd = addDays(eventStart, event.duration - 1);
                if (isWithinInterval(date, { start: eventStart, end: eventEnd })) {
                    value *= event.boost;
                    notes = notes ? `${notes}, ${event.name}` : event.name;
                }
            });
        }

        return { ...point, value, notes };
    });
}

/**
 * Applies influence from Seasonality Markers (High/Low).
 * Interpolates multipliers between markers.
 */
export const applyMarkerInfluence = (series: TimeSeriesPoint[], config: DemGenConfig): TimeSeriesPoint[] => {
    if (!config.markers || config.markers.length === 0) return series;

    // Sort markers by date
    const sortedMarkers = [...config.markers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return series.map(point => {
        const date = parseISO(point.date);
        const dateTs = date.getTime();
        let value = point.value;
        let notes = point.notes;

        // Find surrounding markers
        const nextMarkerIndex = sortedMarkers.findIndex(m => parseISO(m.date).getTime() >= dateTs);

        if (nextMarkerIndex !== -1) {
            // We have a next marker
            const nextMarker = sortedMarkers[nextMarkerIndex];
            const prevMarker = nextMarkerIndex > 0 ? sortedMarkers[nextMarkerIndex - 1] : null;

            if (prevMarker) {
                // Interpolate between Prev and Next
                const t1 = parseISO(prevMarker.date).getTime();
                const t2 = parseISO(nextMarker.date).getTime();
                const total = t2 - t1;
                const current = dateTs - t1;
                const progress = total === 0 ? 0 : current / total;

                // Define multipliers
                const getMult = (type: 'high' | 'low') => type === 'high' ? 1.5 : 0.5;
                const startMult = getMult(prevMarker.type);
                const endMult = getMult(nextMarker.type);

                // Cosine interpolation (smoother)
                const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2;
                const mult = startMult + (endMult - startMult) * cosineProgress;

                value *= mult;
            }
        }

        return { ...point, value, notes };
    });
};

/**
 * Adds realism (anomalies).
 */
export const addRealism = (series: TimeSeriesPoint[], config: DemGenConfig): TimeSeriesPoint[] => {
    return series.map(point => {
        const date = parseISO(point.date);
        const { realism, demand } = getEffectiveConfig(date, config); // Need demand for volatility check
        const { anomalyRate, includeStockouts, dataType } = realism;

        // Strict Zero Volatility: If volatility is 'none', DISABLE anomalies entirely.
        if (demand.volatility === 'none') {
            // Ensure floor is 0 even if no anomalies
            let val = point.value < 0 ? 0 : point.value;
            if (dataType === 'integer') val = Math.round(val);
            else val = parseFloat(val.toFixed(2));
            return { ...point, value: val, isAnomaly: false };
        }

        let value = point.value;
        let notes = point.notes;
        let isAnomaly = false;

        if (Math.random() < anomalyRate) {
            // ... anomaly logic
            const type = Math.random();
            isAnomaly = true;
            if (type < 0.3 && includeStockouts) {
                value = 0;
                notes = 'Stockout';
            } else if (type < 0.6) {
                value *= (2 + Math.random() * 3);
                notes = 'Spike';
            } else {
                value = -Math.abs(value) * 0.5; // This could create negatives, caught by floor below
                notes = 'Data Error';
            }
        }

        // Global Floor & Data Type
        if (dataType === 'integer') {
            value = Math.round(value);
        } else {
            value = parseFloat(value.toFixed(2));
        }

        // Ensure no negatives (unless allowed? User said "globally set floor to 0")
        if (value < 0) {
            value = 0;
            if (!notes || notes === 'Data Error') notes = 'Data Error (Floored)';
        }

        return { ...point, value, notes, isAnomaly };
    });
}

/**
 * Master orchestration function.
 */
export const generateTimeSeries = (config: DemGenConfig): TimeSeriesPoint[] => {
    const dates = generateDateRange(config);

    let series = generateBaseSeries(dates, config);
    series = applyGrowthTrend(series, config); // Updated signature
    series = applyBusinessPatterns(series, config);
    series = applySeasonality(series, config);
    series = applyMarkerInfluence(series, config);
    series = addRealism(series, config);
    series = applyOverrides(series, config);
    return series;
};
