-- Prediction-level outputs for HMI presenter ML tracking.
CREATE SCHEMA IF NOT EXISTS hmi_presenter;

CREATE TABLE IF NOT EXISTS hmi_presenter.ml_prediction_batches (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    run_id text NOT NULL REFERENCES hmi_presenter.ml_improvement_runs(run_id) ON DELETE CASCADE,
    step_id bigint REFERENCES hmi_presenter.ml_improvement_steps(id) ON DELETE SET NULL,
    batch_key text,
    dataset_id text,
    dataset_version text,
    split text,
    record_count integer,
    metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    notes text
);

CREATE UNIQUE INDEX IF NOT EXISTS ml_prediction_batches_run_key_idx
    ON hmi_presenter.ml_prediction_batches (run_id, batch_key);

CREATE INDEX IF NOT EXISTS ml_prediction_batches_step_idx
    ON hmi_presenter.ml_prediction_batches (step_id);

CREATE TABLE IF NOT EXISTS hmi_presenter.ml_predictions (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    batch_id bigint NOT NULL REFERENCES hmi_presenter.ml_prediction_batches(id) ON DELETE CASCADE,
    run_id text NOT NULL,
    step_id bigint,
    sample_id text,
    input_ref text,
    target jsonb NOT NULL DEFAULT '{}'::jsonb,
    prediction jsonb NOT NULL DEFAULT '{}'::jsonb,
    score numeric,
    rank integer,
    error_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ml_predictions_run_idx
    ON hmi_presenter.ml_predictions (run_id);

CREATE INDEX IF NOT EXISTS ml_predictions_step_idx
    ON hmi_presenter.ml_predictions (step_id);

CREATE INDEX IF NOT EXISTS ml_predictions_sample_idx
    ON hmi_presenter.ml_predictions (sample_id);
