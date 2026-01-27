-- Draft: move public tables for hmi_presenter
CREATE SCHEMA IF NOT EXISTS hmi_presenter;
ALTER TABLE IF EXISTS public.hmi_presenter_ui_scores SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.chart_ingest_runs SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.quickstats_irrigation SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.quickstats_irrigation_state_summary SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.ghcn_daily_summary SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.modis_ndvi_timeseries SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.deck_audit_runs SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.deck_audit_slides SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.ml_improvement_runs SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.ml_improvement_steps SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.ml_datasets SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.synthetic_data_runs SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.ml_prediction_batches SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.ml_predictions SET SCHEMA hmi_presenter;
ALTER TABLE IF EXISTS public.slide_chart_metadata SET SCHEMA hmi_presenter;
