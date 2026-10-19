# TerraSown — field notebook design system

## Direction

The user approved the TerraSown field-notebook direction after the older horizontal-nav version. `terrasown.css` is the final presentation layer, loaded after the legacy Dashboard stylesheet and the built React stylesheet. The Dashboard, Plan, Crops and Research views retain their current data and evidence behavior. The legacy redesign branch is not the scientific source of truth.

## Tokens and type

| Role | Value |
| --- | --- |
| Ink | `#183126` |
| Secondary text | `#39493e` |
| Canvas | `#f3f1ea` |
| Surface | `#fdfcf8` |
| Recessed surface | `#e9ece2` |
| Accent / primary action | `#20513a` |
| Notebook rail | `#e5e9dc` |
| Divider / control border | `#c7cec2` / `#718474` |
| Caution text / ground | `#754119` / `#f7ecda` |
| Critical | `#942e28` |

- Display: licensed, locally served Newsreader Regular. Headings use editorial contrast without decorating telemetry.
- Body and controls: licensed, locally served Plus Jakarta Sans Regular and Semibold.
- Values and provenance: licensed, locally served IBM Plex Mono. Keep units with numbers.
- Spacing: 4, 8, 12, 16, 24, 32 and 48px. Surfaces use 1px borders and modest radii; there are no panel shadows or gradients.

## Layout and behavior

- Desktop: 224px fixed notebook index; two-column opening spread with field introduction and NASA data-completeness ring; map and location controls follow. Completeness is data quality, never a farm-health score.
- Tablet and phone: navigation moves to a sticky top row; the dashboard stacks with the map before the completeness panel. Four labeled tabs remain visible at 320px.
- Plan: current React workbench remains evidence-gated. Decorative numbered stage labels are removed, but input order and logic are unchanged.
- Crops and Research: current live discovery, regional scope, trial tables, provenance and limitations remain. Typography and surfaces inherit the same notebook layer.
- Controls stay labeled and at least 48px where the current component permits. Focus-visible, disabled, loading and error states must remain legible. Motion honors `prefers-reduced-motion`.

## Verification boundary

Automated tests check authored palette contrast in the base stylesheet and the notebook shell's local type and responsive breakpoint. This is not a full WCAG AAA certification. Verify actual computed styles, map behavior, view switching and overflow at 320, 375, 390, 430px and desktop after presentation changes. Physical-device and assistive-technology testing remain separate tasks.
