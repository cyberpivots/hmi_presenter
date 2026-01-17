# Recreate Photo + Map Presenter (HMI Presenter)

## Purpose
Document how to recreate a **Photo + Map** presenter page using the existing
photo-map layout as a base inside the **hmi_presenter** workspace.

## Verified source files (base to copy)
- UI HTML: `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi_photo_map.html`
- UI CSS (shared): `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.css`
- UI JS (shared): `/mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi.js`
- Assets (logo/media): `/mnt/g/clarksoft/projects/hmi_presenter/assets/`

## Verified API endpoints (served by master_irrigator)
These are defined in `/mnt/g/clarksoft/projects/master_irrigator/src/app.py`.
- `GET /api/slides`
- `GET /api/slide-decks`
- `POST /api/presenter-actions`
- `POST /api/presentation-runs`
- `POST /api/presentation-versions`

## Copy/paste checklist (WSL)
Checklist:
- [ ] Copy the photo-map HTML file to a new name in `src/`.
- [ ] Keep the shared CSS/JS links unless you need a new theme.
- [ ] Update the page title and header labels.
- [ ] Keep media paths under `/assets/...`.
- [ ] Start the HMI server and open the new page URL.

Copy/paste command:
```sh
cp /mnt/g/clarksoft/projects/hmi_presenter/src/master_irrigator_presentation_hmi_photo_map.html \
  /mnt/g/clarksoft/projects/hmi_presenter/src/my_photo_map_presenter.html
```

## Recreate a similar photo + map page
1) **Rename the HTML file (WSL).**
   - Use the command above.
   - Success looks like the new file exists in `src/`.

2) **Update the page title and labels (WSL).**
   - In `my_photo_map_presenter.html`, change:
     - `<title>`
     - Header text (title + subtitle)
     - Optional status text inside the main stage
   - Success looks like the header matches your new presenter name.

3) **Keep the shared CSS/JS (WSL).**
   - The file already points to `master_irrigator_presentation_hmi.css` and
     `master_irrigator_presentation_hmi.js`.
   - Only change these if you are creating a separate theme or behavior.

4) **Use `/assets/...` for media paths (WSL).**
   - Example:
     ```html
     <img src="/assets/quality_irrigation_logo.png" alt="logo">
     ```

5) **Run the HMI server (WSL).**
   - Start from the master_irrigator repo:
     ```sh
     bash /mnt/g/ClarkSoft/projects/master_irrigator/scripts/start_hmi_dev.sh
     ```
   - Success looks like the terminal prints HMI URLs.

6) **Open your new page (WSL or Windows).**
   - Replace the page name in the base HMI URL.
   - Example (if API base is `http://localhost:52104/hmi/`):
     - `http://localhost:52104/hmi/my_photo_map_presenter.html`

## Notes
- All HMI UI development stays in **hmi_presenter**.
- The API and slide data stay in **master_irrigator**.
- This variant is optimized for large imagery and map panels.
