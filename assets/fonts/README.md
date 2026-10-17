# Local typography

Newsreader, Plus Jakarta Sans and IBM Plex Mono are distributed under the included SIL Open Font License texts. Files were retrieved from official Google Fonts distribution on 2026-10-16.

- Newsreader: https://github.com/google/fonts/tree/main/ofl/newsreader
- Plus Jakarta Sans: https://github.com/google/fonts/tree/main/ofl/plusjakartasans
- IBM Plex Mono: https://github.com/google/fonts/tree/main/ofl/ibmplexmono

The active interface uses Space Grotesk regular, semibold and bold from the pinned `@fontsource/space-grotesk` package. The build copies its WOFF2 files to `dist/`, where the app serves and caches them locally. Its SIL Open Font License is in that package. IBM Plex Mono remains the active metric font. The older Newsreader and Jakarta files are retained as unused licensed assets. Generic fallbacks keep content usable if a font fails to load.
