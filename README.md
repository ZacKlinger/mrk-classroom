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

- `content/project.json`: current status, next steps, last update date, syllabus phases, assessment, and the teaching sequence.
- `content/materials.json`: parts, planning quantities, jobs, and uncertainties. The downloadable CSV is generated from this same list.
- `content/resources.json`: reviewed worksheet, slideshow, and syllabus downloads.
- `content/budget.json`: historical cost lines, their source and accounting basis, and discrepancies.
- `content/components.json`: explanations for the 3D component selections.
- `src/topology.js`: the four independent upper-to-lower routes.
- `src/growth.js`: the water/light growth gate and illustration duration.
- `src/lettuce.js`: instanced butterhead rosettes shared across the planting sites.
- `src/model.js`: approximate geometry and the common supply and return manifolds.
- `index.html`: gallery sections and public metadata. Add future classes alongside Science, Math, and Extracurricular.

To publish an update, edit the relevant content, run `python3 scripts/package-resources.py` when resources or sequence change, run tests and build, and push to `main`. The Pages workflow builds and deploys the exact committed source. Set repository Settings → Pages → Source to GitHub Actions when first configuring the repository.

Update `project.updated` only when classroom progress is refreshed. Changes to page styling alone do not imply new classroom progress. The syllabus, teaching notes, and materials expand on demand. The “Print sequence” action opens the syllabus sections for the browser’s print dialog (including Save as PDF), then restores their previous state. The materials download includes all items regardless of current search filters.

## Student privacy

Do not add student names, identifying details, faces, raw classroom photographs, private learning records, or unreviewed original teaching documents. The attached reference images are intentionally absent from this repository and its history. They contain student faces or names on labels. Add a student photograph or name only when the teacher explicitly authorizes that specific inclusion. Do not infer publication permission from a file attachment.

Public curriculum is paraphrased and excludes class demographics, accommodations tied to individual students, and private school records. No analytics, visitor accounts, question logging, or AI service is installed. The initial release provides authored component explanations; live questions are deferred.

## Model limits

The teacher-confirmed topology is one reservoir/pump → three supply tees forming four branches → four upper channels → four independent lower channels → three return tees → one reservoir return. The binary tree is a schematic arrangement, not a shop drawing. Exact tube sizes, plant-hole counts, fitting locations, grades, pump performance, oxygen provision, and reservoir capacity have not been verified. The animation depicts direction, not measured flow or water depth. It does not claim that flow divides equally.

The geometry is deliberately approximate, including a visible pump in an open reservoir. The lettuce is an explicitly labeled, sped-up illustration, not a completed classroom crop or harvest result. Both water and lights must be on for growth; either switch pauses it. Growth resumes from the same stage, and “Grow again” resets it. Reduced-motion visitors see the mature heads without the growth animation. The model uses four white upper channels, four turquoise lower channels, a braced wooden frame, casters, and lights based on the reference photos. A white studio environment, rounded timber edges, procedural wood grain, open planting apertures, and physical PVC materials provide the rendering. Each head has stable variations in leaf proportions, curvature, tilt, and green tones. Wheel/trackpad input scrolls the page; vertical touch gestures remain available for page scrolling. Use the +/− buttons or keyboard for model zoom, and drag sideways to rotate. It supports orbit, zoom, a pink grow-light switch, a paired water/light growth interaction, keyboard rotation/zoom, raycast component selection, and a reduced-motion flow overlay. If WebGL fails, the page retains an accessible route diagram, component guide, syllabus, and materials list.

## Source provenance

Reviewed source documents; selected blank worksheets and the original project syllabus are now included in `public/resources`. The unit plan remains private:

- Hydroponics_Project_Syllabus.pdf: driving question, assessment weights, and intended culmination.
- Hydroponics Unit Plan.pdf: learning goals and inquiry progression, adapted without fixed weekly dates.
- Science 1.1.pdf: food and land-use investigation.
- Science 1.5.pdf: plant needs and six system jobs.
- Science 1.6.pdf: criteria, constraints, and build planning.
- Science_1_7_-_Tubing_and_tees_-_packet: branching investigation. Its earlier eight-feed/bypass example is superseded by the teacher’s current four paired-route description.
- Hydroponics Planning sheet and April Parts List (Lowes & Amazon): planning materials. Pump ratings and light counts conflict between lists; these are explicitly marked unconfirmed. Historical prices are published with clear estimate labels; purchasing/account fields and uncertain shopping URLs are omitted. The live April tab was checked November 16, 2026: 29 checked item rows sum to $767.06. The old total omits seeds ($19.98) and two later rows ($112). Add the earlier $141 frame estimate for a $908.06 planning baseline. The $101 October water-budget allowance remains separate. The light unit/line mismatch and possible replacement rows are documented in `content/budget.json`.
- Teacher’s current description and supplied reference photographs: current build stage and circulation topology.

General plant-needs context: [University of Minnesota Extension](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/small-scale-hydroponics) and [University of New Hampshire Extension](https://extension.unh.edu/resource/hydroponics-home).

Design inspiration: the typographic hierarchy and exhibition-led structure of [MoMA](https://www.moma.org/). Original layout and illustrations; no museum artwork, logos, or affiliation claims.

## Before publishing a new exhibit

Review public text and assets for student privacy, ground progress claims in teacher updates, verify the build, and inspect desktop and narrow-screen layouts. Do not copy entire teaching folders into this public repository.

## Teacher resource library

Seven blank worksheets, one interactive slideshow, and the original project syllabus are linked directly on GitHub Pages, so visitors do not need Drive access. The ZIP also includes the cost CSV, an adapted teaching sequence, and teaching notes. Science 1.3 duplicated Science 1.2 and is omitted. The Science 1.7 card flags its older eight-feed/bypass design.

Science 3.2 worksheet and slideshow came from the teacher’s Drive lesson folder. The public HTML copy removes the original lesson date and expired Kahoot PIN, retains source credits, and uses the existing backup quiz. External images/videos require internet. No classroom photos, student names, completed work, or private class-profile pages are included. No Drive sharing permissions were changed.

Rebuild the ZIP with `python3 scripts/package-resources.py` after changing resources or the sequence. The packaging script regenerates the budget CSV from `content/budget.json`. Source revisions are editorial updates, not an automatic sync from private Drive.
