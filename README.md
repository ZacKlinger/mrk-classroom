# Mr. K’s Classroom

A public classroom gallery built with Vite and Three.js, published through GitHub Pages. Science opens with an interactive, photo-informed hydroponics study; Math and Extracurricular have room for future exhibitions.

## Run locally

Requires Node.js 22.12+ (or Node.js 24).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Keep the exhibition current

The source files in this repository are the public editorial source of truth. The site does not automatically read private Drive files or publish changes to a teaching document.

- `content/project.json`: current status, next steps, last update date, syllabus phases, assessment, and lesson summaries.
- `content/materials.json`: parts, planning quantities, jobs, and uncertainties. The downloadable CSV is generated from this same list.
- `content/components.json`: explanations for the 3D component selections.
- `src/topology.js`: the four independent upper-to-lower routes.
- `src/model.js`: approximate geometry and the common supply and return manifolds.
- `index.html`: gallery sections and public metadata. Add future classes alongside Science, Math, and Extracurricular.

To publish an update, edit the relevant content, run tests and build, and push to `main`. The Pages workflow builds and deploys the exact committed source. Set repository Settings → Pages → Source to GitHub Actions when first configuring the repository.

Update `project.updated` only when classroom progress is refreshed. Changes to page styling alone do not imply new classroom progress. The “Print syllabus” action uses the browser’s print dialog (including Save as PDF). The materials download includes all items regardless of current search filters.

## Student privacy

Do not add student names, identifying details, faces, raw classroom photographs, private learning records, or unreviewed original teaching documents. The attached reference images are intentionally absent from this repository and its history. They contain student faces or names on labels. Add a student photograph or name only when the teacher explicitly authorizes that specific inclusion. Do not infer publication permission from a file attachment.

Public curriculum is paraphrased and excludes class demographics, accommodations tied to individual students, and private school records. No analytics, visitor accounts, question logging, or AI service is installed. The initial release provides authored component explanations; live questions are deferred.

## Model limits

The teacher-confirmed topology is one reservoir/pump → three supply tees forming four branches → four upper channels → four independent lower channels → three return tees → one reservoir return. The binary tree is a schematic arrangement, not a shop drawing. Exact tube sizes, plant-hole counts, fitting locations, grades, pump performance, oxygen provision, and reservoir capacity have not been verified. The animation depicts direction, not measured flow or water depth. It does not claim that flow divides equally.

The geometry is deliberately approximate, including a visible pump in an open reservoir. No plants or harvest results are presented as completed. The model uses four white upper channels, four turquoise lower channels, a braced wooden frame, casters, and lights based on the reference photos. It supports orbit, zoom, preset views, keyboard rotation/zoom, raycast component selection, and a reduced-motion flow overlay. If WebGL fails, the page retains an accessible route diagram, component guide, syllabus, and materials list.

## Source provenance

Reviewed locally; original files are not included:

- Hydroponics_Project_Syllabus.pdf: driving question, assessment weights, and intended culmination.
- Hydroponics Unit Plan.pdf: learning goals and inquiry progression, adapted without fixed weekly dates.
- Science 1.1.pdf: food and land-use investigation.
- Science 1.5.pdf: plant needs and six system jobs.
- Science 1.6.pdf: criteria, constraints, and build planning.
- Science_1_7_-_Tubing_and_tees_-_packet: branching investigation. Its earlier eight-feed/bypass example is superseded by the teacher’s current four paired-route description.
- Hydroponics Planning sheet and April Parts List (Lowes & Amazon): planning materials. Pump ratings and light counts conflict between lists; these are explicitly marked unconfirmed. Historical prices, purchasing/account fields, and uncertain shopping URLs are omitted.
- Teacher’s current description and supplied reference photographs: current build stage and circulation topology.

General plant-needs context: [University of Minnesota Extension](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/small-scale-hydroponics) and [University of New Hampshire Extension](https://extension.unh.edu/resource/hydroponics-home).

Design inspiration: the typographic hierarchy and exhibition-led structure of [MoMA](https://www.moma.org/). Original layout and illustrations; no museum artwork, logos, or affiliation claims.

## Before publishing a new exhibit

Review public text and assets for student privacy, ground progress claims in teacher updates, verify the build, and inspect desktop and narrow-screen layouts. Do not copy entire teaching folders into this public repository.
