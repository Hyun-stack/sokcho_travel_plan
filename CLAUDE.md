# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file static web app: `index.html`. It's an interactive travel map of Sokcho, South Korea, showing points of interest (cafes, restaurants, landmarks) grouped into 5 zones. No build step, no package manager, no server-side code — just one HTML file with inline `<style>` and `<script>`.

## Running / testing

There is no build or test tooling. To preview, open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python -m http.server`) since it loads Leaflet from a CDN and uses `localStorage`.

## Architecture

Everything lives in `index.html` in three parts:

- **Data**: the `places` array (`[name, lat, lng, zone, category]` tuples) is the single source of truth for all map markers. `zoneColor` and `zoneName` map a numeric zone id (1, 2, 3, 4, 9 — note there is no zone 5-8, ids are not contiguous) to a display color/label. To add or edit a location, edit this array directly.
- **Map rendering**: uses Leaflet + Leaflet.markercluster (both from CDN). Markers are colored by zone and clustered; cluster bubbles take the color of the majority zone inside them. Favorited places get a distinct star icon (`makeIcon`).
- **UI panel**: a bottom sheet (`#panel`) lists places currently visible within the map viewport, recalculated on `moveend`/`zoomend` via `refreshList()`. On mobile it's a draggable sheet (touch handlers on `#panel-drag-handle`); on desktop (`min-width: 769px` media query) it's a fixed sidebar. `getVisibleBounds()` accounts for the sheet covering part of the map on mobile when computing what's "visible".
- **Favorites**: persisted to `localStorage` under the key `sokcho_favs`, toggled via `toggleFav(name)` (exposed on `window` since it's called from inline `onclick` HTML in generated popup/list markup). Changing a favorite re-renders all marker icons and popups (`refreshAll()`).

When adding new places, keep the tuple order and zone id consistent with the existing `zoneColor`/`zoneName` maps — introducing a new zone id requires adding entries to both maps and the `.legend` HTML block.
