# Pacific Paradox: A Climate Story

A scroll-driven data visualisation essay on climate injustice in the Pacific, built for the Pacific Dataviz Challenge 2026.

Author: Muhammad Eka Dimas Saputra, Ni Luh Made Sri Utami, Safa Ayu Artanti
From: Indonesia

## View it live

Once deployed to GitHub Pages (see below), the site is reachable at:

```
https://safaayuartnti.github.io/pasific-dataviz/
```

## Project structure

```
.
├── index.html              entry point, scroll-driven story
├── style.css                all styling (light / dark themes)
├── script.js                data loading, charts, interactions
├── data/
│   └── pacific_data.json    processed Pacific Data Hub dataset
├── .nojekyll                 tells GitHub Pages to skip Jekyll processing
└── README.md
```

## Run locally

Browsers block `fetch()` to local files opened directly (`file://...`),
so the page must be served, not double-clicked. From the project folder:

```bash
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

or, with Node.js installed:

```bash
npx http-server
```

## Deploy to GitHub Pages

1. Create a new repository on GitHub and push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "Pacific Paradox: a climate story"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repository-name>.git
   git push -u origin main
   ```

2. On GitHub, open the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and folder **/ (root)**, then **Save**.
5. Wait a minute, then refresh the Pages settings tab. GitHub will show the
   live URL, typically `https://<your-username>.github.io/<repository-name>/`.

No build step is required. The site is plain HTML, CSS, and JavaScript, and
loads its dataset from `data/pacific_data.json` using a relative path, so it
works whether the repository is served from the root of `*.github.io` or
from a project subpath.

## Data source

Pacific Data Hub, SPC (Secretariat of the Pacific Community)
https://stats.pacificdata.org/

Datasets: DF_CLIMATE_CHANGE, DF_SDG_11, DF_SDG_06, DF_AGRICULTURAL_PRODUCTION
Data period: 1850 to 2025
