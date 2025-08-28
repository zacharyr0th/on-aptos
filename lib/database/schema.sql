-- Simplified Metrics Snapshots Database Schema
-- This schema stores current metrics with just the current date

CREATE TABLE IF NOT EXISTS metric_snapshots (
    id SERIAL PRIMARY KEY,
    
    -- Metric identification
    category VARCHAR(255) NOT NULL,
    metric VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    
    -- Simplified time data - just current date
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Value data
    value_numeric DECIMAL(20, 8), -- For numeric values (TVL, volume, etc.)
    value_text TEXT, -- For text values (ranks, status, etc.)
    formatted_value TEXT NOT NULL, -- Always store the formatted display value
    
    -- Metadata for additional context
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simplified indexes
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_category_metric ON metric_snapshots(category, metric);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_date ON metric_snapshots(snapshot_date);

-- Unique constraint to prevent duplicate snapshots per day
CREATE UNIQUE INDEX IF NOT EXISTS unique_metric_snapshot_daily 
ON metric_snapshots(category, metric, snapshot_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_metric_snapshots_updated_at ON metric_snapshots;
CREATE TRIGGER update_metric_snapshots_updated_at
    BEFORE UPDATE ON metric_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for latest snapshots (simplified)
CREATE OR REPLACE VIEW latest_metric_snapshots AS
SELECT DISTINCT ON (category, metric)
    id,
    category,
    metric,
    source,
    snapshot_date,
    value_numeric,
    value_text,
    formatted_value,
    metadata,
    created_at
FROM metric_snapshots
ORDER BY category, metric, snapshot_date DESC;

-- Sample queries for reference:
-- 
-- Get all snapshots for a specific metric:
-- SELECT * FROM metric_snapshots 
-- WHERE category = 'TVL - Current Metrics' AND metric = 'Aptos TVL'
-- ORDER BY snapshot_date DESC;
--
-- Get latest snapshots for all metrics:
-- SELECT * FROM latest_metric_snapshots;
--
-- Get historical data for a metric:
-- SELECT snapshot_date, formatted_value, value_numeric
-- FROM metric_snapshots 
-- WHERE category = 'TVL - Current Metrics' AND metric = 'Aptos TVL'
-- ORDER BY snapshot_date ASC;