-- Deck audit metrics (slide-level) for HMI presenter.
CREATE SCHEMA IF NOT EXISTS hmi_presenter;
SET search_path TO hmi_presenter, public;

CREATE TABLE IF NOT EXISTS hmi_presenter.deck_audit_runs (
    run_id text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    timestamp_utc text,
    source_path text,
    summary_files jsonb NOT NULL DEFAULT '[]'::jsonb,
    notes text
);

CREATE TABLE IF NOT EXISTS hmi_presenter.deck_audit_slides (
    id bigserial PRIMARY KEY,
    run_id text NOT NULL REFERENCES hmi_presenter.deck_audit_runs(run_id) ON DELETE CASCADE,
    deck_id text,
    deck_title text,
    slide_index integer,
    viewport text,
    mean_luma numeric,
    contrast_std numeric,
    pct_over_240 numeric,
    pct_below_15 numeric,
    media_expected boolean,
    media_present boolean,
    media_fit_pct numeric,
    low_contrast boolean,
    media_fit_issue boolean,
    path text
);

CREATE UNIQUE INDEX IF NOT EXISTS deck_audit_slides_run_idx
    ON hmi_presenter.deck_audit_slides (run_id, deck_id, slide_index, viewport);

CREATE INDEX IF NOT EXISTS deck_audit_slides_deck_idx
    ON hmi_presenter.deck_audit_slides (deck_id, slide_index);

CREATE INDEX IF NOT EXISTS deck_audit_slides_viewport_idx
    ON hmi_presenter.deck_audit_slides (viewport);
