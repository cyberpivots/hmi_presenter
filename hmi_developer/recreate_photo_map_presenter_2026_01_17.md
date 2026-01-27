# Recreate Photo + Map Presenter (HMI Presenter)

## Purpose
Document how to recreate a **Photo + Map** presenter page using the existing
photo-map layout as a base inside the **hmi_presenter** workspace.

## Verified source files (base to copy)
- UI HTML base: `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.html`
- UI CSS (shared): `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css`
- UI JS (shared): `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.js`
- Assets (logo/media): `/mnt/g/clarksoft/projects/hmi_presenter/assets/`

## Expected API endpoints (confirm in the API repo)
These are defined in `/mnt/g/clarksoft/projects/<hmi_api_repo>/src/app.py`.
- `GET /api/slides`
- `GET /api/slide-charts`
- `GET /api/slide-decks` (only if you add a deck selector)

## Copy/paste checklist (WSL)
Checklist:
- [ ] Copy the base presenter HTML file to a new name in `src/`.
- [ ] Keep the shared CSS/JS links unless you need a new theme.
- [ ] Update the page title and header labels.
- [ ] Keep media paths under `/assets/...`.
- [ ] Start the HMI server and open the new page URL.

Copy/paste command:
```sh
cp /mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.html \
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
   - The file already points to `clarksoft_hmi_presenter.css` and
     `clarksoft_hmi_presenter.js`.
   - Only change these if you are creating a separate theme or behavior.

4) **Add the photo + map layout (WSL).**
   - Insert a media panel and a map panel inside the stage area.
   - Keep layout changes isolated to your new HTML file.

5) **Use `/assets/...` for media paths (WSL).**
   - Example:
     ```html
     <img src="/assets/quality_irrigation_logo.png" alt="logo">
     ```

6) **Run the HMI server (WSL).**
   - Start from the HMI API repo:
     ```sh
     bash /mnt/g/ClarkSoft/projects/clarksoft_hmi_presenter/scripts/start_hmi_dev.sh
     ```
   - Success looks like the terminal prints HMI URLs.

7) **Open your new page (WSL or Windows).**
   - Replace the page name in the base HMI URL.
   - Example (if API base is `http://localhost:52104/hmi/`):
     - `http://localhost:52104/hmi/my_photo_map_presenter.html`

## Notes
- All HMI UI development stays in **hmi_presenter**.
- The API and slide data stay in **clarksoft_hmi_presenter**.
- This variant is optimized for large imagery and map panels.
