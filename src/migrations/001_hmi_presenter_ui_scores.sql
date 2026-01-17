-- HMI Presenter UI scoring and review log.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgml;

CREATE TABLE IF NOT EXISTS hmi_presenter_ui_scores (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    run_id text NOT NULL,
    hmi_url text,
    screenshot_path text,
    ocr_text text,
    ocr_confidence numeric(6, 3),
    issues jsonb NOT NULL DEFAULT '[]'::jsonb,
    score numeric(6, 2),
    notes text,
    embedding vector(384)
);

CREATE INDEX IF NOT EXISTS hmi_presenter_ui_scores_created_at_idx
    ON hmi_presenter_ui_scores (created_at DESC);
