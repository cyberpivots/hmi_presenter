# Command Center Asset CV Handoff (2026-01-17)

## Summary
- Source images: `/mnt/g/clarksoft/projects/master_irrigator/assets/media/`
  - `State-of-the-art irrigation command center.png`
  - `High-tech control room with placeholders.png`
- CV run_id: `oem_assets_20260117_123735`
- OCR engine: tesseract
- Embedding model: sentence-transformers/all-MiniLM-L6-v2
- Embedding source_label: `ocr_filename`

## Where the data lives (DB)
- `assets` (one row per image)
- `media_asset_cv_runs` (run metadata)
- `media_asset_ocr_metrics` (OCR metrics + text)
- `media_asset_embeddings` (pgml embeddings)

## Latest asset IDs (from run note)
- Asset ID 1: `State-of-the-art irrigation command center.png`
- Asset ID 2: `High-tech control room with placeholders.png`

## Example query (join OCR + embeddings)
```sql
SELECT
  a.asset_id,
  a.filename,
  o.ocr_confidence,
  o.text_density,
  o.avg_font_px,
  o.mean_luma,
  o.contrast_std
FROM media_asset_ocr_metrics o
JOIN assets a ON a.asset_id = o.asset_id
WHERE o.run_id = 'oem_assets_20260117_123735'
ORDER BY a.filename;
```

## Notes for HMI use
- OCR text is sparse for these images. Expect low confidence.
- Use filename + OCR text embedding for similarity or tagging.
- If you need previews in the HMI, read `assets.file_path` and render from disk.
