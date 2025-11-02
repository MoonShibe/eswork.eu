# ES Work Website Repository Structure

The full ES Work marketing site now lives on the dedicated **`project`** branch. The default branch keeps a lightweight README so you can quickly locate the working files.

## Getting the project branch locally

```bash
git clone https://github.com/<your-account>/eswork.eu.git
cd eswork.eu
git checkout project
```

If the branch is not yet available locally, fetch it first:

```bash
git fetch origin project:project
```

## What's inside `project`

The branch contains the complete static site:

- `index.html` – the hero banner, services, testimonials, and CTA blocks.
- `assets/` – stylesheets, JavaScript (including translations and form logic), and media assets.
- `blog/` – three starter articles for content marketing and the blog index page.
- `robots.txt`, `sitemap.xml` – SEO support files.
- `fahrerfragebogen.html`, `eswork.ue.html` – additional landing pages/forms.

## Publishing and previewing

Once on the `project` branch you can follow the existing README there to run a local preview or publish the site (e.g. via GitHub Pages). The instructions remain unchanged from the previous version of the repository.

## Why the split?

Keeping the main branch minimal lets you manage documentation or deployment metadata separately from the full site bundle while still providing access to the complete project history on the `project` branch.
