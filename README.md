# ES Work Website

This repository contains the ES Work marketing site. The full site lives on both the `work` branch (current) and the `project` branch for convenience.

## Viewing the site locally

1. Install dependencies (none required beyond a static file server).
2. From the repository root run:
   ```bash
   python3 -m http.server 8000
   ```
3. Open <http://localhost:8000/index.html> in your browser to explore the updated landing page, vacancy listings, and forms.

## Branch layout

- `work` – primary branch with the latest content (this branch).
- `project` – mirror branch created so you can check out the site directly with:
  ```bash
  git checkout project
  ```

## Project structure

- `index.html`, `fahrerfragebogen.html`, `eswork.ue.html` – main HTML entry points.
- `assets/css/` – stylesheets for the landing page and questionnaire.
- `assets/js/` – JavaScript for localization, interactivity, and forms.
- `assets/img/` – contains the SVG logo plus empty folders for optional project and team photos. The site renders colour blocks as placeholders until you add your own JPG files.

## Image placeholders

Add the following photos to `assets/img/` when you're ready to replace the colour placeholders:

- `assets/img/projects/assembly-line.jpg`
- `assets/img/projects/construction-crew.jpg`
- `assets/img/projects/site-installation.jpg`
- `assets/img/projects/logistics-team.jpg`
- `assets/img/team/team-management.jpg`
- `assets/img/team/team-coordinator.jpg`
- `assets/img/team/team-operations.jpg`

Feel free to open the files directly or serve them locally to review the experience.
