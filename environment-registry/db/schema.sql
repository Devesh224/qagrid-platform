CREATE TABLE IF NOT EXISTS environments (
    environment_id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    environment_type VARCHAR(20) NOT NULL CHECK (environment_type IN ('BROWSER', 'MOBILE', 'API')),
    platform VARCHAR(100),
    operating_system VARCHAR(100),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    status VARCHAR(25) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE')),
    health_status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN' CHECK (health_status IN ('HEALTHY', 'UNHEALTHY', 'UNKNOWN')),
    maintenance_reason TEXT,
    maintenance_started_at TIMESTAMPTZ,
    maintenance_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS environments_filter_idx
    ON environments (status, health_status, environment_type);
