# Recreate Presenter Shell (HMI Presenter)

## Purpose
Document how to recreate a presenter UI similar to the current ClarkSoft presenter
inside the **hmi_presenter** workspace. This keeps all HMI UI work in
`/mnt/g/clarksoft/projects/hmi_presenter`.

## Verified source files (base to copy)
- UI HTML: `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.html`
- UI CSS: `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css`
- UI JS: `/mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.js`
- Data tools (optional):
  - `/mnt/g/clarksoft/projects/hmi_presenter/src/hmi_data_tools.html`
  - `/mnt/g/clarksoft/projects/hmi_presenter/src/hmi_data_tools.css`
  - `/mnt/g/clarksoft/projects/hmi_presenter/src/hmi_data_tools.js`
- Assets (logo/media): `/mnt/g/clarksoft/projects/hmi_presenter/assets/`

## Expected API endpoints (confirm in the API repo)
These are defined in `/mnt/g/clarksoft/projects/<hmi_api_repo>/src/app.py`.
- `GET /api/slides`
- `GET /api/slide-charts`
- `GET /api/slide-decks` (only if you add a deck selector)
- `POST /api/slide-charts` (optional, for data tools upserts)

## Copy/paste checklist (WSL)
Use this checklist to avoid missing steps.

Checklist:
- [ ] Copy the three base files into new names in `src/`.
- [ ] Update the `<link rel=\"stylesheet\">` tag to your new CSS file.
- [ ] Update the `<script src>` tag to your new JS file.
- [ ] Update the page `<title>` and header text.
- [ ] Keep slide/media URLs under `/assets/...`.
- [ ] Start the HMI dev server and open the new page URL.

Copy/paste commands:
```sh
cp /mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.html \
  /mnt/g/clarksoft/projects/hmi_presenter/src/my_presenter.html
cp /mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css \
  /mnt/g/clarksoft/projects/hmi_presenter/src/my_presenter.css
cp /mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.js \
  /mnt/g/clarksoft/projects/hmi_presenter/src/my_presenter.js
```

## Recreate a similar presenter page
1) **Copy the base files (WSL).**
   - Copy the three base files and rename them for your new presenter page.
   - Example (rename to `my_presenter_*`):
     ```sh
     cp /mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.html \
       /mnt/g/clarksoft/projects/hmi_presenter/src/my_presenter.html
     cp /mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.css \
       /mnt/g/clarksoft/projects/hmi_presenter/src/my_presenter.css
     cp /mnt/g/clarksoft/projects/hmi_presenter/src/clarksoft_hmi_presenter.js \
       /mnt/g/clarksoft/projects/hmi_presenter/src/my_presenter.js
     ```
   - Success looks like the new files exist in `src/`.

2) **Update the HTML to point to your new CSS/JS (WSL).**
   - In `my_presenter.html`, update the `<link>` and `<script>` tags.
   - Example:
     ```html
     <link rel="stylesheet" href="my_presenter.css?v=1">
     ...
     <script src="my_presenter.js?v=1"></script>
     ```
   - Success looks like the page loads without missing CSS/JS.

3) **Update visible labels (WSL).**
   - In `my_presenter.html`, change:
     - `<title>`
     - Header text
     - Subtitles and deck labels
   - Success looks like the header and title show your new name.

4) **Confirm endpoint constants (WSL).**
   - In `my_presenter.js`, confirm these constants match the server:
     - `SLIDE_ENDPOINT = "/api/slides"`
     - `DECK_LIST_ENDPOINT = "/api/slide-decks"`
     - `PRESENTER_ACTION_ENDPOINT = "/api/presenter-actions"`
     - `PRESENTATION_RUN_ENDPOINT = "/api/presentation-runs"`
     - `PRESENTATION_VERSION_ENDPOINT = "/api/presentation-versions"`
   - Only change these if the API routes change.

5) **Use `/assets/...` for media paths (WSL).**
   - Keep image/video sources under `/assets/...` so FastAPI can serve them.
   - Example in HTML:
     ```html
     <img src="/assets/quality_irrigation_logo.png" alt="logo">
     ```

6) **Run the HMI server (WSL).**
   - Start from the HMI API repo:
     ```sh
     bash /mnt/g/ClarkSoft/projects/clarksoft_hmi_presenter/scripts/start_hmi_dev.sh
     ```
   - Success looks like the terminal prints HMI URLs.

7) **Open your new presenter page (WSL or Windows).**
   - Use the base HMI URL from the script output, then replace the page name.
   - Example (if API base is `http://localhost:52104/hmi/`):
     - `http://localhost:52104/hmi/my_presenter.html`

## Notes
- All HMI UI development stays in **hmi_presenter**.
- The API and slide data stay in **clarksoft_hmi_presenter**.
- If you need a new deck, update the deck catalog JSON under
  `/mnt/g/clarksoft/projects/<hmi_api_repo>/assets/fixtures/`.
