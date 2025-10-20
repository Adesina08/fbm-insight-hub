# Dashboard Analytics Methodology

This document summarises how the BEHAV360 dashboard transforms Google Sheets submissions into the analyses that appear in each tab. It covers the data flow, derived variables, and the calculations that power every visualisation.

## Data ingestion and normalisation

1. **Fetching data** – The client requests analytics JSON from the configured Google Sheets endpoints (defaults to `/api/sheets-data` and `/api/sheets-metadata`, overridable through `VITE_SHEETS_*` environment variables). Responses are validated as JSON, normalised, and passed to the analytics builder.【F:src/lib/googleSheets.ts†L31-L200】
2. **Field mapping** – Incoming submission keys are harmonised through a default field map (`motivation_score`, `ability_score`, etc.) that can be overridden via environment variables or per-call overrides.【F:src/lib/analytics.ts†L7-L32】【F:src/lib/analytics.ts†L837-L860】
3. **Key normalisation** – Raw submission keys are lowercased, converted to snake case, and deduplicated to create a `Map` for flexible lookup and fuzzy matching against questionnaire IDs and labels.【F:src/lib/analytics.ts†L25-L145】
4. **Derived metrics** – When explicit columns are missing, the pipeline computes scores from questionnaire responses by tokenising question text/options and parsing Likert-style answers (numeric or textual). This produces core psychosocial drivers, prompt exposures, and a current-use flag before any dashboard aggregation runs.【F:src/lib/analytics.ts†L146-L590】

## Derived variables

| Metric | Source fields / questions | Transformation |
| --- | --- | --- |
| **Motivation score** | Questions C1–C4 | Average of parsed Likert scores on a 1–5 scale.【F:src/lib/analytics.ts†L520-L526】 |
| **Ability score** | Questions D1–D6 | Average of parsed Likert scores on a 1–5 scale.【F:src/lib/analytics.ts†L528-L535】 |
| **Descriptive norms** | Question F1 | Parsed Likert score (1–5).【F:src/lib/analytics.ts†L537-L538】 |
| **Injunctive norms** | Question F2 | Parsed Likert score (1–5).【F:src/lib/analytics.ts†L537-L538】 |
| **System readiness** | Questions G1–G3 | Average of parsed Likert scores (1–5).【F:src/lib/analytics.ts†L540-L544】 |
| **Prompt facilitator** | E1 options “Yes, from a health worker” or “Yes, from community/religious leaders”; fallback to E2 | Binary prompt exposure averaged, scaled to 1–5; defaults to prompt likelihood if exposure missing.【F:src/lib/analytics.ts†L546-L587】 |
| **Prompt spark** | E1 option “Yes, from media (radio, TV, social media)”; fallback to E2 | Same exposure logic as facilitator prompts.【F:src/lib/analytics.ts†L546-L587】 |
| **Prompt signal** | E1 option “Yes, from a partner/spouse”; fallback to E2 | Same exposure logic as facilitator prompts.【F:src/lib/analytics.ts†L546-L587】 |
| **Current contraceptive use** | Question B2 (yes/no) with B3 fallback | Boolean flag inferred from direct response or presence of a method description.【F:src/lib/analytics.ts†L571-L579】 |

All Likert parsing handles textual phrases (“very easy”, “somewhat difficult”, etc.) and ignores null-like answers such as “n/a” or “don’t know”.【F:src/lib/analytics.ts†L146-L449】

## Dashboard calculations by tab

### Overview

- **Headline cards** report total respondents, current users, and the average motivation/ability scores. Counts come directly from submission totals; changes use period splits (first half vs. second half of dated submissions) to compute percentage or absolute shifts.【F:src/lib/analytics.ts†L936-L1100】【F:src/components/dashboard/DashboardOverview.tsx†L91-L198】
- **Quadrant summary** groups submissions into BJ Fogg Behaviour Model quadrants (threshold ≥3 for “high”), calculates each segment’s share of classified responses, average motivation/ability, and current-use rate.【F:src/lib/analytics.ts†L961-L979】【F:src/lib/analytics.ts†L1161-L1176】

### FBM Quadrant chart

- Scatter points plot each respondent with valid motivation, ability, and current-use data. Norms overlay averages descriptive and injunctive norms, while the system overlay uses system readiness. Marker size scales linearly with the selected overlay value.【F:src/lib/analytics.ts†L981-L993】【F:src/components/dashboard/FBMQuadrantChart.tsx†L63-L151】
- Quadrant boundaries are fixed at score 3 for both axes to align with the segmentation thresholds.【F:src/components/dashboard/FBMQuadrantChart.tsx†L152-L207】

### Segment profiles

- Each quadrant becomes a behavioural segment with percentage of total submissions, average driver scores, prompt receptivity (mean of facilitator/spark/signal), current-use rate, templated insights, and tailored recommendations.【F:src/lib/analytics.ts†L995-L1027】【F:src/lib/analytics.ts†L780-L834】【F:src/components/dashboard/SegmentProfiles.tsx†L9-L205】
- Radar charts visualise motivation, ability, combined norms, and system readiness on the 1–5 scale; progress bars echo the same values.【F:src/components/dashboard/SegmentProfiles.tsx†L27-L195】

### Prompt effectiveness heatmap

- For each segment, facilitator, spark, and signal prompt scores are averaged independently using all respondents in that quadrant. The heatmap scales colour between the observed minimum and maximum (clamped to 1–5) and highlights the highest scoring cell.【F:src/lib/analytics.ts†L1030-L1039】【F:src/components/dashboard/PromptEffectivenessHeatmap.tsx†L13-L137】

### Predictive model view

- **Regression-style cards** compare mean driver scores between current users and non-users, report the difference as a pseudo beta, categorise the strength, assign approximate p-value bands, and generate narrative interpretations.【F:src/lib/analytics.ts†L1042-L1093】【F:src/lib/analytics.ts†L1254-L1290】【F:src/components/dashboard/PathDiagram.tsx†L33-L207】
- **Model summary** surfaces overall current-use rate, average norms, average system readiness, and the largest segment by count.【F:src/lib/analytics.ts†L1293-L1328】【F:src/components/dashboard/PathDiagram.tsx†L208-L233】

## Customisation notes

- Environment variables (`VITE_SHEETS_FIELD_*`) let you remap sheet columns to the internal field keys without code changes.【F:src/lib/analytics.ts†L837-L860】
- The pipeline automatically falls back to derived scores when mapped columns are missing, ensuring analyses still render as long as the questionnaire responses are present.【F:src/lib/analytics.ts†L867-L928】
- Prompt exposure computation treats “No prompts received” selections as zero exposure and rescales binary yes/no data to the 1–5 prompt score range, so all prompt analyses align with the Likert scale used elsewhere.【F:src/lib/analytics.ts†L472-L587】

With these transformations, the dashboard delivers live behavioural insights from raw survey submissions while remaining resilient to schema changes in the source spreadsheet.
