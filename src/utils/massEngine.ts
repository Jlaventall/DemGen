import { DemGenConfig, MassGenConfig, TimeSeriesPoint, Volatility } from '../types';
import { generateTimeSeries } from './engine';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a random number using Triangular Distribution.
 * @param min Minimum value
 * @param mode Mode (peak) value
 * @param max Maximum value
 */
export const triangular = (min: number, mode: number, max: number): number => {
    const u = Math.random();
    const c = (mode - min) / (max - min);

    if (u < c) {
        return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
        return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
};

export interface GeneratedItem {
    id: string;
    name: string;
    config: DemGenConfig; // The resolved config for this item
    data: TimeSeriesPoint[];
}

/**
 * Generates a single item config from the mass config distributions.
 */
const generateItemConfig = (massConfig: MassGenConfig): DemGenConfig => {
    // 1. Demand
    const avgDaily = Math.round(triangular(massConfig.demand.averageDaily.min, massConfig.demand.averageDaily.mode, massConfig.demand.averageDaily.max));
    const growthRate = Math.round(triangular(massConfig.demand.growthRate.min, massConfig.demand.growthRate.mode, massConfig.demand.growthRate.max));

    // Volatility: Map numeric 0-3 to string 'none'|'low'|'medium'|'high'
    // 0-0.5 = None, 0.5-1.5 = Low, 1.5-2.5 = Med, >2.5 = High
    const volVal = triangular(massConfig.demand.volatility.min, massConfig.demand.volatility.mode, massConfig.demand.volatility.max);
    let volatility: Volatility = 'low';

    if (volVal < 0.5) volatility = 'none';
    else if (volVal < 1.5) volatility = 'low';
    else if (volVal < 2.5) volatility = 'medium';
    else volatility = 'high';

    // 2. Seasonality
    // Although the core `engine.ts` currently only supports `holidayMonths` (binary),
    // we need to support weighted seasonality per month for Mass Mode.

    // We update DemGenConfig to support monthlyWeights in `seasonality`.

    return {
        time: massConfig.time,
        demand: {
            averageDaily: avgDaily,
            growthRate: growthRate,
            volatility: volatility
        },
        patterns: {
            weekendBoost: 0, // Ignored in mass mode? or Default?
            storeHours: '9-5',
            monthlyPatterns: []
        },
        seasonality: {
            holidayMonths: [], // We will use monthlyWeights instead if we add it
            holidayStrength: 1,
            events: [],
            // @ts-ignore - We will add this to interface next
            monthlyWeights: {}
        },
        realism: {
            anomalyRate: 0.01,
            includeStockouts: false,
            dataType: 'integer'
        },
        segments: [],
        markers: [],
        overrides: {}
    };
};

export const generateMassData = (config: MassGenConfig): GeneratedItem[] => {
    const items: GeneratedItem[] = [];
    const generatedHashes = new Set<string>();

    for (let i = 0; i < config.itemCount; i++) {
        const itemConfig = generateItemConfig(config);

        // Resolve seasonality weights
        const weights: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) {
            const dist = config.seasonality.monthWeights[m];
            if (dist) {
                weights[m] = triangular(dist.min, dist.mode, dist.max);
            } else {
                weights[m] = 1.0;
            }
        }
        // Attach weights to config (needs type update)
        (itemConfig.seasonality as any).monthlyWeights = weights;

        const data = generateTimeSeries(itemConfig);

        // Generate Unique Hash (supports 100k items)
        // 5 Hex chars = 20 bits (1,048,576 possibilities)
        let hash = '';
        let attempts = 0;
        do {
            hash = Math.floor(Math.random() * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
            attempts++;
            if (attempts > 100) {
                console.warn("Hash collision retry limit reached, appending index.");
                hash = `${hash}-${i}`;
                break;
            }
        } while (generatedHashes.has(hash));

        generatedHashes.add(hash);

        items.push({
            id: uuidv4(),
            name: `it-${hash}`,
            config: itemConfig,
            data
        });
    }

    return items;
};
