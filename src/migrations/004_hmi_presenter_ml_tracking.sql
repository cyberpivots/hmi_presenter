-- ML improvement tracking for HMI presenter (shared DB schema).
CREATE SCHEMA IF NOT EXISTS hmi_presenter;

CREATE TABLE IF NOT EXISTS hmi_presenter.ml_improvement_runs (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    run_id text NOT NULL,
    project_key text NOT NULL DEFAULT 'hmi_presenter',
    goal text,
    status text NOT NULL DEFAULT 'planned',
    mode text,
    algorithms jsonb NOT NULL DEFAULT '[]'::jsonb,
    dataset_id text,
    dataset_version text,
    synthetic_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
    metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    params jsonb NOT NULL DEFAULT '{}'::jsonb,
    source_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
    artifact_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
    notes text
);

CREATE INDEX IF NOT EXISTS ml_improvement_runs_created_at_idx
    ON hmi_presenter.ml_improvement_runs (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ml_improvement_runs_run_id_idx
    ON hmi_presenter.ml_improvement_runs (run_id);

CREATE TABLE IF NOT EXISTS hmi_presenter.ml_improvement_steps (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    run_id text NOT NULL REFERENCES hmi_presenter.ml_improvement_runs(run_id) ON DELETE CASCADE,
    step_name text,
    algorithm text,
    algorithm_variant text,
    seed integer,
    status text NOT NULL DEFAULT 'planned',
    metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    params jsonb NOT NULL DEFAULT '{}'::jsonb,
    training_seconds numeric,
    model_path text,
    notes text
);

CREATE INDEX IF NOT EXISTS ml_improvement_steps_run_id_idx
    ON hmi_presenter.ml_improvement_steps (run_id);

CREATE TABLE IF NOT EXISTS hmi_presenter.ml_datasets (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    dataset_id text NOT NULL,
    dataset_name text,
    dataset_version text,
    source text,
    row_count integer,
    data_hash text,
    path text,
    notes text
);

CREATE UNIQUE INDEX IF NOT EXISTS ml_datasets_id_version_idx
    ON hmi_presenter.ml_datasets (dataset_id, dataset_version);

CREATE TABLE IF NOT EXISTS hmi_presenter.synthetic_data_runs (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    run_id text NOT NULL REFERENCES hmi_presenter.ml_improvement_runs(run_id) ON DELETE CASCADE,
    generator text,
    base_dataset_id text,
    output_dataset_id text,
    record_count integer,
    augmentations jsonb NOT NULL DEFAULT '[]'::jsonb,
    constraints jsonb NOT NULL DEFAULT '{}'::jsonb,
    path text,
    notes text
);

CREATE INDEX IF NOT EXISTS synthetic_data_runs_run_id_idx
    ON hmi_presenter.synthetic_data_runs (run_id);
