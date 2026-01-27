-- Slide chart metadata for ClarkSoft HMI Presenter (ECharts default).
CREATE SCHEMA IF NOT EXISTS hmi_presenter;
SET search_path TO hmi_presenter;

CREATE TABLE IF NOT EXISTS hmi_presenter.slide_chart_metadata (
    deck_id text NOT NULL,
    slide_index integer NOT NULL,
    chart_library text NOT NULL DEFAULT 'echarts',
    chart_type text,
    chart_title text,
    alt_text text NOT NULL,
    data_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
    layout_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
    config_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (deck_id, slide_index)
);

CREATE INDEX IF NOT EXISTS slide_chart_metadata_deck_idx
    ON hmi_presenter.slide_chart_metadata (deck_id);
