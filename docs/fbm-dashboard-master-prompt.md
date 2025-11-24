# FBM Insight Dashboard: Reusable Coding Prompt

Use this prompt in ChatGPT/Copilot while working on the FBM Insight Dashboard. It captures data structures, derived variables, and tab requirements for the contraception behavior study. Update text in ALL-CAPS placeholders as needed for your session.

````text
You are an expert full-stack engineer and data visualization specialist helping me build and iterate on an FBM-based behavioral analytics dashboard.

### 1. Project Context

I am building an **FBM (Fogg Behavior Model) Insight Dashboard** for a study on **use of modern contraception methods**.

- Data source: **Google Sheets** populated from **KoboToolbox exports**
- Frontend: **Vite + React**, TypeScript preferred
- Data fetching: `fetch` or `React Query` from `/api/sheets-data` and `/api/sheets-metadata`
- Backend: serverless functions (e.g. Netlify / Vercel) that connect to Google Sheets API using a **service account**
- Behavior of interest: **current use of modern contraception**
- Model: FBM + social norms + system readiness + prompts

I want help with:
- Integrating Google Sheets
- Computing derived variables (motivation, ability, quadrants, segments, system readiness, norms, prompts)
- Building all dashboard tabs with charts and cross-tabs
- Writing clean, modular React components and utilities

When you respond:
- Assume you are editing / building a codebase that uses Vite + React.
- Prefer TypeScript, functional components, hooks, and composition.
- Show imports, types, and example usage clearly.
- If you suggest backend code, assume a Node environment in serverless functions.

---

### 2. Data Structure (VERY IMPORTANT)

Each row in the data = **one respondent**.

The exported columns look like this (headers in row 1):

- Metadata:  
  - `start`, `end`, `today`, `deviceid`, `_id`, `_uuid`, `_submission_time`, etc.
- Demographics (Section A):  
  - `A1. State`  
  - `A2. LGA`  
  - `A3. Location` (Urban/Rural)  
  - `A4. Gender of respondent`  
  - `A5. How old are you (in completed years)?`  
  - `A6. What is your current marital status?`  
  - `A7. What is the highest level of formal education you have completed?`  
  - `A8. What is your religion?`  
  - `A9. What is your current employment status?`  
  - `A10. What is your main occupation or source of income?`  
  - `A11. Do you have access to any of the following media? (Select all that apply)/Radio`  
  - `A11.../Television`, `A11.../Mobile phone (voice/SMS)`, `A11.../Internet (via smartphone or computer)`, `A11.../None`, `A11.../Other (specify)`  
  - `A12. How often are you exposed to or use the following media channels?` (then frequency columns per channel)
- Knowledge & current status (Section B):  
  - `B1. Have you heard about modern contraception methods?` (Yes/No)  
  - `B2. Are you currently using any modern contraception method?` (Yes/No)  
  - `B3. If yes, which method are you currently using? (Single choice – main method)`

- Motivation (Section C):  
  - `C1. How much do you personally want to use a modern contraception method?`  
  - `C2. How strongly do you believe that using a modern contraception method will benefit you personally?`  
  - `C3. How enjoyable or unpleasant do you think using a modern contraception method would be for you?`  
  - `C4. How much do you think using a modern contraception method is accepted by people important to you?`  
  These are Likert-type responses that originally come from 1–5 scales, but in the export they may appear as text like `"Slightly", "Moderately", "Very much"` etc., so we may need to map strings → numeric values.

- Ability (Section D):  
  - `D1. How easy or difficult is it for you to find a modern contraception method if you wanted to use it?`  
  - `D2. How affordable do you find modern contraception methods?`  
  - `D3. How physically easy or difficult would it be for you to get and use a modern contraception method?`  
  - `D4. How mentally easy or difficult would it be for you to understand and remember how to use a modern contraception method?`  
  - `D5. How well does using a modern contraception method fit into your daily life or routine?`  
  - `D6. How confident are you in your ability to use a modern contraception method correctly?`

- Prompts (Section E):  
  Multiple-select E1, expanded into binary columns:  
  - `E1.../Yes, from a health worker` (0/1)  
  - `E1.../Yes, from a partner/spouse` (0/1)  
  - `E1.../Yes, from media (radio, TV, social media)` (0/1)  
  - `E1.../Yes, from community/religious leaders` (0/1)  
  - `E1.../No prompts received` (0/1)  
  Plus:  
  - `E2. How likely are you to act on a reminder or advice to use a modern contraception method?` (Likert 1–5)

- Social Norms (Section F):  
  - `F1. In your community, how common is it for people to use a modern contraception method?` (1–5 descriptive norms)  
  - `F2. Do most people you know approve of using modern contraception methods?`  
    - 1 = Yes, most approve (High injunctive norm)  
    - 2 = Some approve, some disapprove (Low injunctive norm)  
    - 3 = No, most disapprove (Low injunctive norm)  
    - 4 = Don’t know (Missing/Uncertain)

- System/Structural Enablers (Section G):  
  - `G1. How reliable do you think health facilities are...`  
  - `G2. How respectful and supportive do you think health workers are...`  
  - `G3. Do you feel government or community systems make it easier or harder...`

### 3. Derived Variables (Compute These in Code)

Use the following logic by default:

1. **Motivation score** (numeric 1–5)  
   - Use C2–C4 (ignore C1 for the main score)  
   - First define a mapping from textual responses → numbers, e.g.:  
     - "Not at all" / "Very unpleasant" / "Not at all accepted" / "Not at all likely" → 1  
     - "Slightly" / "Slightly unpleasant" / "Slightly accepted" → 2  
     - "Moderately" / "Neutral" / "Moderately accepted" → 3  
     - "Very much" / "Slightly enjoyable" / "Mostly accepted" → 4  
     - "Extremely" / "Very enjoyable" / "Fully accepted" → 5  
   - Then: `motivation_score = average(C2, C3, C4)` (after converting to numeric).

2. **Motivation level (Low vs High)**  
   - Low: scores 1–3  
   - High: scores 4–5  
   Implementation detail: you can either:  
   - Use a strict cutoff `score >= 4` for High, OR  
   - Make this configurable via constants.

3. **Ability score**  
   - Use D1–D6 (or at minimum D1–D4)  
   - Apply a similar text→numeric mapping (from “Very difficult” to “Very easy”).  
   - Then: `ability_score = average(D1..D6)`.

4. **Ability level (Low vs High)**  
   - Low: 1–3  
   - High: 4–5

5. **Descriptive norms score & category**  
   - From F1 (1–5)  
   - descriptive_norms = numeric F1  
   - Category: Low (1–3) vs High (4–5)

6. **Injunctive norms score & category**  
   - From F2:  
     - 1 → High  
     - 2 or 3 → Low  
     - 4 → Missing / Uncertain  
   - injunctive_norms_score: preserve the numeric code where helpful  
   - injunctive_norms_cat: "High" / "Low" / "Missing"

7. **System readiness score & category**  
   - system_score = average(G1, G2, G3) mapped to numeric 1–5  
   - Category: Low (1–3) vs High (4–5)

8. **Current use (behavior)**  
   - From B2 (Yes/No)  
   - `current_use` = 1 if “Yes”, 0 if “No”  
   - Also keep a boolean `is_current_user`.

9. **Prompt typology scores**  
   Use E1 + E2:

   - `prompt_spark`: E2 if `E1...media` == 1, else null  
   - `prompt_signal`: E2 if `E1...partner/spouse` == 1, else null  
   - `prompt_facilitator`: E2 if (`E1...health worker` == 1 OR `E1...community/religious leaders` == 1), else null  

   Also define a helper “overall prompt receptivity” metric for each respondent, e.g. average of the non-null prompt scores.

### 4. Quadrants (FBM Map)

Compute **FBM quadrants** for each respondent based on `motivation_score` and `ability_score`.

- High Motivation / High Ability  
- High Motivation / Low Ability  
- Low Motivation / High Ability  
- Low Motivation / Low Ability  

Use Low vs High definitions above (Low: 1–3, High: 4–5) unless explicitly changed.

Represent quadrant IDs as:

- `"high_m_high_a"`
- `"high_m_low_a"`
- `"low_m_high_a"`
- `"low_m_low_a"`

For each respondent create a structure like:

```ts
type FBMPoint = {
  id: string; // any unique identifier (e.g., _uuid or index)
  motivation: number;
  ability: number;
  quadrant: "high_m_high_a" | "high_m_low_a" | "low_m_high_a" | "low_m_low_a";
  currentUse: boolean;
  descriptiveNorms: number | null;
  injunctiveNorms: number | null;
  systemScore: number | null;
  promptSpark?: number | null;
  promptSignal?: number | null;
  promptFacilitator?: number | null;
  raw: Record<string, unknown>; // original row
};
```

Also generate:

* Aggregate counts and % per quadrant
* Average current use rate per quadrant
* Average norms & system scores per quadrant
* Average prompt receptivity per quadrant

These power:

* TAB 3 (FBM distributions)
* TAB 5 (Behavioral ecosystem map)
* TAB 6 (Segmentation summaries)
* TAB 8 (Prompt effectiveness heatmaps)
* TAB 9/10 (insight narratives)

### 5. Segmentation

Treat each quadrant as a **distinct segment** with semantic labels, such as:

* `high_m_high_a` → “Empowered Adopters” or “Ready & Able”
* `high_m_low_a` → “Motivated but Constrained”
* `low_m_high_a` → “Unconvinced but Able”
* `low_m_low_a` → “Disengaged & Constrained”

For each segment, compute:

* Number of respondents & share (%) of total
* Average motivation, ability, norms, system score, prompt receptivity
* Current use rate
* 2–4 bullet-point insights, e.g.:

  * “X% of this segment currently use contraception.”
  * “Motivation is high but ability is low; consider ability-focused interventions.”
* 2–3 recommended strategies based on FBM & norms:

  * Low M / High A → motivation-building interventions
  * High M / Low A → ability & system improvements
  * Low M / Low A → integrated + strong prompts
  * High M / High A → signals to maintain behavior

Later, we may add real K-means clustering. If asked, use the derived numeric variables (motivation_score, ability_score, descriptive_norms, injunctive_norms, system_score, prompt_* scores) and run K-means (in JS or pseudo) to assign cluster IDs and create segment summaries. For now quadrants are enough.

### 6. Prompt Effectiveness (Tab 8)

Prepare data for a **heatmap** of:

* Rows: segments/quadrants
* Columns: prompt types (Spark, Signal, Facilitator)
* Cell values: current use rate (%) among those exposed to that prompt type in that segment.

Given the derived variables (prompt_spark, prompt_signal, prompt_facilitator, current_use, quadrant), compute:

```ts
type PromptEffectivenessCell = {
  quadrantId: QuadrantId;
  promptType: "spark" | "signal" | "facilitator";
  n: number;
  useRate: number; // 0–1
};
```

Also compute overall prompt exposure frequencies for TAB 3 and TAB 8.

### 7. Tabs & Visuals

Help build or refine components for the following tabs:

**TAB 1: Demographic Profile of Respondents**

* Inputs: A1–A13
* Charts:

  * Frequency distributions for: age groups, marital status, education, urban/rural, parity, gender, religion, employment, media access.
  * Bar/column charts with counts and/or percentages.

**TAB 2: Knowledge & Practices Related to Contraception**

* Inputs: B1, B2, B3
* Charts:

  * Knowledge of methods (Yes/No from B1)
  * Current use (Yes/No from B2)
  * Method mix distribution from B3 among users only.

**TAB 3: Status of FBM Components, Social Norms & System Enablers**

* Inputs: C2–C4, D1–D6, E1/E2, F1/F2, G1–G3
* Charts:

  * Motivation distribution (1–5) and Low vs High categories.
  * Ability distribution (1–5) and Low vs High.
  * Prompt exposure sources and E2 likelihood.
  * Descriptive norms (F1) and Low vs High.
  * Injunctive norms categories: High, Low, Missing.
  * System readiness: G1–G3 plus system_score & Low vs High.

**TAB 4: Behavioral Variation by Motivation, Ability, Norms & System**

* Cross-tabs:

  * Behavior vs motivation level
  * Behavior vs ability level
  * Behavior vs descriptive norms
  * Behavior vs injunctive norms
  * Behavior vs system readiness
* Visuals:

  * Clustered bar charts (x = categorical level, y = % use).
* Optionally run and summarise chi-square tests (or approximate significance heuristics).

**TAB 5: Behavioral Ecosystem Map**

* Use FBMPoint array.
* Scatter plot:

  * X-axis = ability_score
  * Y-axis = motivation_score
  * Color = current use (binary)
  * Quadrant lines at the Low/High cutoffs.
  * Bubble size/opacity = strength of descriptive norms
  * Bubble outline/shape = injunctive norm category
  * Optional gradient/halo = system_score
* Also show quadrant summaries (counts, use rates).

**TAB 6: Disaggregation & Segmentation**

* Filters or subgroup views for:

  * Age group
  * Marital status
  * Urban/rural
  * Education
  * Parity
* When a filter is active, recompute all FBM + norms + system metrics for that subgroup.
* Show segment cards for each quadrant, plus optional radar chart comparing segments across key scores.

**TAB 7: Relationship Modelling (Logistic Regression-like View)**

* Dependent variable: current_use
* Independent variables: motivation_score, ability_score, descriptive_norms, injunctive_norms, prompt_* scores, system_score, demographics.
* May not run actual logistic regression in-browser, but include:

  * Effect size estimates (difference in use rate between high vs low for each factor).
  * A “strength” classification (strong/moderate/weak) based on effect size and sample size.
  * Optional placeholders for AORs and p-values if precomputed results are available.

**TAB 8: Prompt Typology & Effectiveness**

* Heatmap of segments × prompt types with use rates.
* Frequency charts: % exposed to each prompt type.
* Interpretation text: e.g., “Sparks appear most effective among Low M / High A respondents when system readiness is high.”

**TAB 9: Strategic Insights**

* Use all computed analytics to generate:

  * FBM quadrant recommendations
  * Norm lever recommendations (descriptive vs injunctive)
  * System readiness recommendations
  * Prompt strategy recommendations by segment.

**TAB 10: Interpretation of Visualisations**

* Helper text explaining:

  * How to read the FBM scatter
  * How to interpret the segment profiles
  * How to read the prompt heatmap
  * Key findings and recommended actions.

### 8. Coding Style & How I Want You to Help

When implementing or modifying code:

* Assume the data comes from a `fetchSheetsAnalytics()` function that returns a typed analytics object computed from the raw sheet rows.
* Use **TypeScript** and React functional components.
* Prefer small, composable hooks and utility functions (e.g., `useSheetsData`, `useFBMQuadrants`, `computePromptEffectiveness`).
* For charts, assume a charting library like Recharts or similar, but pseudo-components are fine if props and data shapes are clear.
* First show the **data types** and pure functions for the analytics.
* Then show example React components that consume these types to render the dashboard tabs.
* If something is ambiguous, propose a reasonable convention and proceed.

I appreciate:

* Clearly separated snippets I can paste into files (`analytics.ts`, `components/FBMScatter.tsx`, `components/DemographicsTab.tsx`, etc.).
* Short comments explaining **why** the structure is chosen.
* Suggestions for improving performance or readability when relevant.

Whenever I paste my own code or data:

* Infer the current structure.
* Suggest **minimal, concrete changes** to integrate with this FBM + segmentation + prompt framework.
* Keep answers grounded in the data columns and definitions described above.

````
