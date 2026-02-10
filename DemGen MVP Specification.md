# DemGen MVP Specification

## Project Overview
**DemGen** is a web-based synthetic time series generator focused on creating realistic sales/demand data. The tool allows users to configure parameters through an intuitive UI and immediately visualize the generated time series.

## Technical Stack
- **Frontend**: React with TypeScript
- **Charting**: Recharts or Chart.js
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useContext)
- **Backend**: Node.js/Express (optional for MVP - can be client-side only)

## Core Features

### 1. Configuration Panel (Left Sidebar)

#### A. Time Settings
```
┌─────────────────────────┐
│ Time Range              │
├─────────────────────────┤
│ Start Date: [2024-01-01]│
│ End Date:   [2024-12-31]│
│ Granularity: [● Daily   │
│              ○ Weekly   │
│              ○ Monthly] │
└─────────────────────────┘
```

#### B. Demand Profile
```
┌─────────────────────────┐
│ Base Demand             │
├─────────────────────────┤
│ Average Daily Units: [100]│
│                        │
│ Growth Trend:         │
│ [↗ +5% monthly]       │
│ [→ No growth]         │
│ [↘ -2% monthly]       │
│ [Custom: __%]         │
│                        │
│ Volatility:           │
│ [● Low] ○ Medium ○ High│
└─────────────────────────┘
```

#### C. Business Patterns
```
┌─────────────────────────┐
│ Business Rhythm         │
├─────────────────────────┤
│ Store Hours:           │
│ [● 9AM-5PM]            │
│ [○ 10AM-9PM]           │
│ [○ 24/7]               │
│                        │
│ Weekend Effect:        │
│ [Weekends +50%] ▼      │
│                        │
│ Monthly Pattern:       │
│ [✓] End-of-month surge │
│ [✓] Mid-month slump    │
└─────────────────────────┘
```

#### D. Seasonality & Events
```
┌─────────────────────────┐
│ Seasonal Effects        │
├─────────────────────────┤
│ Holiday Months:        │
│ [✓] December           │
│ [✓] July               │
│ [ ] November           │
│                        │
│ Holiday Strength:      │
│ [● 2x] ○ 3x ○ 5x       │
│                        │
│ [+] Add Promotion      │
│ ┌─────────────────────┐│
│ │ Black Friday        ││
│ │ Nov 29, 2024        ││
│ │ 3 days, +300%       ││
│ └─────────────────────┘│
└─────────────────────────┘
```

#### E. Realism Settings
```
┌─────────────────────────┐
│ Data Realism            │
├─────────────────────────┤
│ Cleanliness:           │
│ [● Perfect]            │
│ [○ Realistic (3%)]     │
│ [○ Messy (10%)]       │
│                        │
│ Include:               │
│ [✓] Stockouts          │
│ [✓] Data errors        │
│ [ ] Negative values    │
│                        │
│ Data Type:             │
│ [● Integer] ○ Decimal  │
└─────────────────────────┘
```

### 2. Visualization Area (Main Canvas)

#### Primary Chart
```
┌─────────────────────────────────────────────┐
│  DemGen - Generated Time Series              │
│                                              │
│  📈                                         │
│      ▲                                      │
│  400 │                        ███           │
│      │              ███      ██ ██          │
│  300 │      ███    ██ ██    ██   ██         │
│      │     ██ ██  ██   ██  ██     ██        │
│  200 │    ██   ████     ████       ██       │
│      │   ██     ██       ██         ███     │
│  100 │  ██                █           ███   │
│      │ ██                                 ██│
│    0 └──────────────────────────────────────▶
│       Jan  Feb  Mar  Apr  May  Jun  Jul     │
│                                              │
│  Stats: Avg: 142 | Max: 387 | Min: 0        │
└─────────────────────────────────────────────┘
```

#### Chart Controls
- **Zoom**: Slider or drag-to-zoom
- **Toggle**: Show/Hide trend line
- **Export**: PNG, CSV buttons
- **Reset View**: Reset zoom button

### 3. Data Output Panel (Bottom Section)

#### Generated Data Preview
```
┌─────────────────────────────────────────────┐
│ Generated Data (First 10 rows)              │
├─────────────────────────────────────────────┤
│ Date        | Units Sold | Notes            │
│ 2024-01-01  | 92         |                  │
│ 2024-01-02  | 104        |                  │
│ 2024-01-03  | 0          | Stockout        │
│ 2024-01-04  | 117        |                  │
│ 2024-01-05  | 153        | Weekend boost   │
│ 2024-01-06  | 148        | Weekend boost   │
│ 2024-01-07  | 98         |                  │
│ ...         | ...        | ...              │
├─────────────────────────────────────────────┤
│ Total Points: 365 | Download: [CSV] [JSON]  │
└─────────────────────────────────────────────┘
```

## Component Structure

```typescript
// Main App Structure
interface DemGenApp {
  // Configuration state
  config: {
    time: {
      startDate: string;
      endDate: string;
      frequency: 'daily' | 'weekly' | 'monthly';
    };
    demand: {
      averageDaily: number;
      growthRate: number;  // monthly %
      volatility: 'low' | 'medium' | 'high';
    };
    patterns: {
      storeHours: '9-5' | '10-9' | '24-7';
      weekendBoost: number;  // e.g., 0.5 for +50%
      monthlyPatterns: string[];  // ['end_surge', 'mid_slump']
    };
    seasonality: {
      holidayMonths: number[];  // 1-12
      holidayStrength: number;  // multiplier
      events: Array<{
        name: string;
        date: string;
        duration: number;  // days
        boost: number;     // multiplier
      }>;
    };
    realism: {
      anomalyRate: number;  // 0-0.1
      includeStockouts: boolean;
      dataType: 'integer' | 'decimal';
    };
  };
  
  // Generated data
  generatedData: Array<{
    date: string;
    value: number;
    notes?: string;
  }>;
  
  // Chart state
  chart: {
    zoomLevel: number;
    showTrendLine: boolean;
    visibleRange: [string, string];
  };
}
```

## Key Components

### 1. ConfigurationPanel.tsx
- **Sections**: TimeSettings, DemandProfile, BusinessPatterns, SeasonalityEvents, RealismSettings
- **State**: Local form state synced with global config
- **Features**: Validation, preset loading, reset button

### 2. TimeSeriesChart.tsx
- **Chart Types**: Line chart (primary), bar chart option
- **Features**: Zoom, hover tooltips, trend line toggle, event markers
- **Annotations**: Mark promotions, holidays, stockouts

### 3. DataTable.tsx
- **Display**: Paginated table of generated data
- **Features**: Sort by date/value, filter by notes, quick stats
- **Export**: CSV, JSON download buttons

### 4. StatsPanel.tsx
- **Metrics**: Average, Min, Max, Standard Deviation, Total
- **Anomaly Count**: Number of stockouts/spikes
- **Trend Analysis**: Simple trend detection display

## Algorithm Specification

### Step 1: Generate Base Series
```typescript
function generateBaseSeries(config) {
  // 1. Create date range based on frequency
  const dates = generateDateRange(config.time);
  
  // 2. Apply base average with normal distribution
  let series = dates.map(date => {
    const baseValue = config.demand.averageDaily;
    const noise = applyVolatility(baseValue, config.demand.volatility);
    return { date, value: noise };
  });
  
  // 3. Apply growth trend (compounding monthly)
  series = applyGrowthTrend(series, config.demand.growthRate);
  
  return series;
}
```

### Step 2: Apply Business Patterns
```typescript
function applyBusinessPatterns(series, config) {
  return series.map(point => {
    const date = new Date(point.date);
    const dayOfWeek = date.getDay();
    
    // Weekend boost
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sat, Sun
      point.value *= (1 + config.patterns.weekendBoost);
    }
    
    // Store hours (zero out closed hours for hourly data)
    if (config.time.frequency === 'hourly') {
      point.value = applyStoreHours(point, config.patterns.storeHours);
    }
    
    // End-of-month surge (last 3 days)
    const dayOfMonth = date.getDate();
    const daysInMonth = getDaysInMonth(date);
    if (dayOfMonth > daysInMonth - 3) {
      point.value *= 1.3; // +30%
    }
    
    return point;
  });
}
```

### Step 3: Apply Seasonality & Events
```typescript
function applySeasonality(series, config) {
  return series.map(point => {
    const date = new Date(point.date);
    const month = date.getMonth() + 1;
    
    // Holiday months
    if (config.seasonality.holidayMonths.includes(month)) {
      point.value *= config.seasonality.holidayStrength;
    }
    
    // Specific events
    config.seasonality.events.forEach(event => {
      if (isDateInEventRange(point.date, event)) {
        point.value *= event.boost;
        point.notes = point.notes ? `${point.notes}, ${event.name}` : event.name;
      }
    });
    
    return point;
  });
}
```

### Step 4: Add Realism
```typescript
function addRealism(series, config) {
  const anomalyRate = config.realism.anomalyRate;
  
  return series.map(point => {
    // Random anomalies based on rate
    if (Math.random() < anomalyRate) {
      const anomalyType = Math.random();
      
      if (anomalyType < 0.3 && config.realism.includeStockouts) {
        // Stockout (zero)
        point.value = 0;
        point.notes = 'Stockout';
      } else if (anomalyType < 0.6) {
        // Spike (+200-500%)
        point.value *= (2 + Math.random() * 3);
        point.notes = 'Spike';
      } else {
        // Data error (negative or extremely high)
        point.value = -Math.abs(point.value) * 0.5;
        point.notes = 'Data error';
      }
    }
    
    // Round if integer data type
    if (config.realism.dataType === 'integer') {
      point.value = Math.round(point.value);
    }
    
    return point;
  });
}
```

## UI/UX Requirements

### Responsive Layout
```
Desktop:
┌──────────────────────────────┐
│ Header & Controls            │
├───────┬──────────────────────┤
│ Config│       Chart          │
│ Panel │                      │
│       │                      │
│       ├──────────────────────┤
│       │      Data Table      │
└───────┴──────────────────────┘

Mobile:
┌──────────────────────────────┐
│ Header                       │
├──────────────────────────────┤
│ Config Panel (Collapsible)   │
├──────────────────────────────┤
│ Chart                        │
├──────────────────────────────┤
│ Data Table                   │
└──────────────────────────────┘
```

### Color Scheme
- **Primary**: Blue (#3B82F6) for chart line
- **Secondary**: Green (#10B981) for trend line
- **Accent**: Orange (#F59E0B) for anomalies
- **Background**: Light gray (#F9FAFB)

### Interactive Elements
- **Hover**: Show point details on chart hover
- **Click**: Select point to highlight in table
- **Drag**: Zoom/pan on chart
- **Presets**: Quick-load buttons for common scenarios

## API Endpoints (If Backend Added)

### POST /api/generate
```typescript
Request: {
  config: DemGenConfig;
}

Response: {
  success: boolean;
  data: TimeSeriesPoint[];
  stats: {
    average: number;
    min: number;
    max: number;
    total: number;
    anomalies: number;
  };
}
```

### GET /api/presets
```typescript
Response: {
  presets: Array<{
    id: string;
    name: string;
    description: string;
    config: DemGenConfig;
    icon: string;
  }>;
}
```

## MVP Milestones

### Minutes 1-2: Core Infrastructure
- Project setup with React + TypeScript
- Basic layout with sidebar and main area
- Configuration form with state management
- Simple chart placeholder

### Minutes 3-4: Generation Engine
- Implement base series generation
- Add business patterns (weekend, store hours)
- Basic chart visualization
- Data table display

### Minutes 5-6: Advanced Features
- Seasonality and event system
- Anomaly injection
- Export functionality
- Preset configurations
- Mobile responsiveness

### Minutes 7-8: Polish & Testing
- UI/UX improvements
- Performance optimization
- Error handling
- Documentation
- Deployment

## Success Metrics
1. **Generation Speed**: < 500ms for 1 year of daily data
2. **UI Responsiveness**: < 100ms for UI updates
3. **Browser Support**: Chrome, Firefox, Safari latest
4. **Mobile Usability**: All features accessible on mobile
5. **User Testing**: 90% of testers can generate desired data in < 2 minutes

## Next Phase Features (Post-MVP)
1. Multi-series generation with correlations
2. Advanced distributions (Poisson, log-normal)
3. Custom pattern upload (CSV template)
4. Team collaboration features
5. API access for programmatic generation
6. Advanced analytics (seasonality decomposition, forecasting)

## Development Notes
- Use `date-fns` for date manipulation
- Consider `zustand` for state management if complexity grows
- Implement debouncing for configuration changes to avoid excessive re-renders
- Add loading states during generation
- Provide clear error messages for invalid configurations
- Include "Copy Config" button to share setups

This spec provides everything needed for a developer to build the MVP. The focus is on a single, high-quality time series generation with an excellent user experience.