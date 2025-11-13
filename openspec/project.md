# Project Context

## Purpose
PSO-LITE is a organization tool for a psychosomatic inpatient department. It is used to plan patients and their therapy and staff assignments as well as planning and managing staff.

## Tech Stack
- Eleventy 3.x (static site generator)
- Node.js (for local development and builds)
- Bootstrap 5.3 (UI components and layout)
- Popper.js (positioning for dropdowns/tooltips)
- Bootstrap Icons (icon set)
- FullCalendar 6.x (calendar UI)
- idb-keyval (IndexedDB convenience)
- js-cookie (client-side cookie utilities)

## Project Conventions

### Code Style
JavaScript/HTML/CSS with the following defaults.

- Indentation: 2 spaces
- Quotes: single quotes in JS, double in HTML attributes
- Semicolons: required
- File naming: kebab-case for assets and Eleventy templates

### Architecture Patterns
Static site generated with Eleventy.

- Content and templates compiled at build time
- Client-side enhancements via vanilla JS and the libraries listed above
- CSS via Bootstrap; custom overrides in project styles if present
- No Eleventy config file found yet; defaults are assumed
- HTML sites are in /sites
- Javascript, CSS files, and images are in /_site/src
- Persisting data is loaded from and saved to JSON files via a DataManager

### Testing Strategy
No testing at all.

### Git Workflow
- Branching: feature branches off main, small PRs
- Commits: Conventional Commits (feat, fix, chore, docs, refactor, test)
- Reviews: require 1 approval for non-trivial changes

## External Dependencies
- Library-only
- No external dependencies
- No CDN
- Never add dependencies without explicit approval
