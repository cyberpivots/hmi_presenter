-- Chart data mirror tables for HMI presenter (shared DB schema).
CREATE SCHEMA IF NOT EXISTS hmi_presenter;

CREATE TABLE IF NOT EXISTS hmi_presenter.chart_ingest_runs (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    run_id text NOT NULL,
    source_name text NOT NULL,
    source_uri text,
    file_path text,
    row_count integer,
    notes text
);

CREATE TABLE IF NOT EXISTS hmi_presenter.quickstats_irrigation (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    state_alpha text,
    state_name text,
    county_name text,
    year integer,
    value_text text,
    value_numeric numeric,
    unit text,
    short_desc text,
    commodity text,
    statistic text
);

CREATE INDEX IF NOT EXISTS quickstats_irrigation_state_idx
    ON hmi_presenter.quickstats_irrigation (state_alpha);

CREATE INDEX IF NOT EXISTS quickstats_irrigation_year_idx
    ON hmi_presenter.quickstats_irrigation (year);

CREATE TABLE IF NOT EXISTS hmi_presenter.quickstats_irrigation_state_summary (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    state_alpha text,
    total_value numeric
);

CREATE INDEX IF NOT EXISTS quickstats_irrigation_state_summary_idx
    ON hmi_presenter.quickstats_irrigation_state_summary (state_alpha);

CREATE TABLE IF NOT EXISTS hmi_presenter.ghcn_daily_summary (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    station text,
    state text,
    date date,
    prcp_tenths_mm numeric,
    tmax_tenths_c numeric,
    tmin_tenths_c numeric
);

CREATE INDEX IF NOT EXISTS ghcn_daily_summary_station_idx
    ON hmi_presenter.ghcn_daily_summary (station);

CREATE INDEX IF NOT EXISTS ghcn_daily_summary_date_idx
    ON hmi_presenter.ghcn_daily_summary (date);

CREATE TABLE IF NOT EXISTS hmi_presenter.modis_ndvi_timeseries (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    site_id text,
    site_name text,
    date text,
    modis_date text,
    value numeric,
    band text,
    product text
);

CREATE INDEX IF NOT EXISTS modis_ndvi_timeseries_site_idx
    ON hmi_presenter.modis_ndvi_timeseries (site_id);

CREATE INDEX IF NOT EXISTS modis_ndvi_timeseries_date_idx
    ON hmi_presenter.modis_ndvi_timeseries (date);
