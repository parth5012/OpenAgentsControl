---
name: email-sorter-ui
description: "Build or change the email triage dashboard and any classification-results view in projects/email-triage — distribution/result cards, run bar, question rail, workspace tabs, drill-through filters, cost modal, table/export, sync freshness or spend readout — or when the user asks for the 'Sorter' look, how triage results should be presented, a new question, a new source tab, or a Jev/Clef use case. Reference pattern: Uppit AI Sorter (reference/)."
---

# Email Sorter UI

`projects/email-triage/static/index.html` follows the Sorter layout captured in `reference/`. Read the images below before writing markup; the shape carries, the colors do not — this project's tokens live in the `:root` block of `index.html` (dark theme, screenshots are light).

## Reference images

| File | What it teaches |
|---|---|
| `01-tab-email-full-shell.png` | Full shell: tabs, question rail, run bar, card grid, feedback pill |
| `02-cost-comparison-modal.png` | Cost modal: measured vs list-price, per-1,000 normalization, `Against Jev` baseline |
| `03-tab-youtube-comments.png` | Run receipt line, unit-aware sample selector, 8-question rail |
| `04-tab-x-feed-table-export.png` | Item table with one column per question, search + Export |
| `05-in-situ-extension-chips.png` | In-situ mode: judgment chips over the native feed instead of a dashboard |
| `06-tab-video-clips.png` | Two-unit counting (20 videos → 565 segments), score cards `of 4` |
| `07-tab-job-lead-filter-sample-data.png` | Sample-data state: `Sample data, nothing to connect` |
| `08-tab-brain-dump-router.png` / `09-tab-customer-support.png` / `10-tab-skool-posts.png` | Recipe subtitles, routing/churn question sets |

## Shell

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚡ brand   tab · tab · tab · tab (each with live count)            │
│                                              spend · freshness      │
├───────────┬────────────────────────────────────────────────────────┤
│ Question  │  Title + one-line recipe + sample ▾ + Refresh          │
│ rail      │  Run bar: status ▸ receipt ▸ model ▸ scope ▸ [▶ Run]   │
│           │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│           │  │ card     │ │ card     │ │ card     │  ← auto-fit,    │
│           │  └──────────┘ └──────────┘ └──────────┘    3→2→1 cols  │
│           │  Search ▸ item table (one column per question) ▸ Export│
└───────────┴────────────────────────────────────────────────────────┘
```

Four zones, in fixed order: tabs → question rail (left) → run bar + card grid (center) → item table (below the grid).

## Recipe header

Every source screen states what it is and what the model does with it, in two lines:

- `Your latest long-form videos, transcribed and cut into 35 to 60 second segments. Each segment is a clip candidate.`
- `Made-up support tickets for a booking app. Jev routes each one and flags the customers about to leave.`

Line 1 = the unit of work; line 2 = the decision the model makes for you. Write both when adding a tab.

## Question rail

- One row per decision question: enable checkbox · title · type label · pencil (edit). `QUESTIONS_TAXONOMY` in `projects/email-triage/email_triage.py` is the single source of truth; the rail renders it, so a new taxonomy key appears with no HTML edit.
- Type label comes from the question's `type`: `noul` → `Yes / No`, `choice` → `Category`, `score` → `Score`.
- Ship 6–8 questions per source, mixed types, and every one answers a decision the user actually takes (archive? reply? route? call first? escalate? churn risk?). A question nobody acts on stays off the rail.
- `+ New` sits at the top of the rail.

## Run bar

One row, left to right:

1. **Status sentence** — state, guidance, and empty state in one plain sentence: `All caught up. Select any result below to filter the emails.`, `Running… 420 of 1,000`.
2. **Run receipt** — directly beneath it after a run: `✓ Sorted 1,000 in 5 sec for $0.05. Compare cost.` Time, cost, and the modal link, as one checked sentence.
3. **Model selector** — the existing `#model-select` (Clef-Flash / Clef / Jev / …). Model choice belongs here, one control, always visible.
4. **Scope selector** — what a run touches, defaulting to `Anything not sorted yet`, so runs are incremental and safe to repeat.
5. **Run** — primary button, play glyph, right end of the bar.

Cards, filters, and triggers live in the run bar and grid; the screen header keeps identity, recipe, sample size, and refresh.

## Distribution card (the core)

Each enabled question renders one card: header row (title, plus aggregate for `score` types) and one row per answer bucket.

- **Row** = bucket label · bar · count. Count right-aligned, tabular figures.
- **Bar** = neutral track + accent fill, ~10px, pill radius, width `count / max bucket count` for `choice`, `count / sample size` for `noul`.
- **`noul`** → two rows, `Yes` then `No`.
- **`choice`** → one row per category from `criteria`, sorted by count descending; after row 5, a `Show N more` link expands the remainder in place.
- **`score`** → one row per `criteria` entry, label as `N. Short name` (`1. Low`), header carries `Average 0.6 of 10` where the denominator is the question's `scale`. Band edges come from the taxonomy's `bands` thresholds (upper bound per band), **not** equal quarters of the scale: Clef's real urgency output spans ~0–3, so quarters of a 0–10 scale collapse every row into `Low`. Keep `bands` aligned with whatever thresholds the table badges already use, so card and badge never disagree.
- **Every row drills through**: the row is a native `<button type="button">` (keyboard-operable, `:focus-visible` ring — never a clickable `div`), clicking it filters the item table to that `question + bucket`, the active row is highlighted, and a second click clears the filter. The grid is the dashboard's filter UI.

The card shows bars and counts only — the numbers are the visual.

## Item table

- One column per enabled question, beside the content columns (sender/subject, or post/date), so per-item answers sit next to what they judged.
- Search box on the left of the table header, item count and `Export` on the right.
- Unit-aware labels throughout: the sample selector counts source units (`1,000 comments`, `20 videos`), the header counts scored units (`565 segments`, `42 tickets`).

## Cost modal (`Compare cost`)

Two tables, each with a plain-English subtitle:

1. **Measured on this tab** — model · sorted · time · cost · time per 1,000 · cost per 1,000 · `Against Jev`. Actuals from the run log, normalized per 1,000 so runs of different sizes compare.
2. **Estimate at list price** — price per 1M tokens (in/out) · last run · per 1,000 · everything to date · `Against Jev`. What the same tokens would cost on every other model.

`Against Jev` is a baseline multiplier computed from cost-per-1,000 (`1x`, `12x`) — one honest number instead of prose, `—` whenever either side lacks a figure. **Never invent a price**: a price the project can't substantiate from README/env stays `null`, and when *no* price is substantiated the list-price table renders a single row saying so rather than a wall of dashes (hide the footnote too). Modal chrome: title top-left, ✕ top-right, `Close` bottom-right, body scrolls.

## Freshness, spend, feedback

- Screen header right: sample size, `Synced today at 9:27 AM`, count selector, `Refresh`. A source with no live connection says `Sample data, nothing to connect` in the same slot — the tab still runs end to end on fixtures.
- Spend stays pinned in the top bar as `Spent so far: $1.18 on Jev, $2.32 on other models` with `Compare cost` opening the modal.
- Feedback pill floats bottom-right: 👍 👎 · comment · share · sparkle · more, anchored to the run.

## In-situ mode

Where a dashboard is too heavy (a live feed in another app), surface judgments as a single chip line over the native UI: `Jev · 24 judged · 2 breaking · 3 urgent, 5 slow`. Same question set, same counts, no shell — see `05-in-situ-extension-chips.png`.

## Jev / Clef use-case recipes

Each reference tab is a recipe: a source, its unit, a question set, and the action it drives.

| Tab | Unit | Question shape | Action |
|---|---|---|---|
| Email | email | irrelevant / category / urgency / action | archive, reply |
| YouTube comments | comment | type · worth a reply · sentiment · difficulty · spam | reply, pin |
| X feed | post | topic · breaking · substance · worth replying | reply, share |
| Video clips | segment | clippable · hook · clip type · payoff · quotable | cut, publish |
| Job and lead filter | lead | lead quality · next step · decision-maker · red flags | call first |
| Brain dump router | thought | where it goes · deadline · priority · life area | route to list |
| Customer support | ticket | route to · urgency · frustration · about to leave | triage, retain |
| Skool posts | post | post type · churn risk · team answer · testimonial | respond, flag |

Model roles for a new recipe: `noul` gates and bulk passes ride the cheap fast path (Clef-Flash, ~38ms); `choice` and `score` that need calibration ride Jev. `auto` cascades — cheap first, Jev on the uncertain middle.

## Data contract for the grid

Cards read one aggregate payload — they never scan rows in the browser. This is the shape the email-triage backend now serves (`GET /api/email-triage/distributions?threshold=<irrelevance cutoff>`):

```
→ { "sample_size": 48,        # rows already sorted (buckets sum to this per question)
    "total": 50, "uncategorized": 2,
    "threshold": 0.7,
    "synced_at": "2026-10-25T09:27:00+00:00",   # null when nothing is sorted
    "timestamp": "…",
    "questions": [
      { "question": "category", "title": "Email type", "type": "choice",
        "answered": 48,
        "buckets": [ { "key": "work", "label": "Work & GitHub", "count": 27 }, … ],
        "average": null, "scale": null },
      { "question": "urgency", "title": "Urgency", "type": "score",
        "answered": 48, "average": 0.6, "scale": 10,
        "buckets": [ { "key": "low", "label": "1. Low", "count": 41 }, … ] } ] }
```

Rules the payload guarantees, so the UI can trust it:

- **`questions` follows taxonomy order**; every question carries `title` (the rail and card header read it, never a hard-coded string) and `answered` (per-question rows that have a value — `noul`/`choice`/`score` each define it differently).
- **Buckets always sum to `answered`**, and `answered ≤ sample_size ≤ total`. Zero-count buckets stay in the payload so card layout does not jump as data arrives.
- **`score` average denominator is `scale`** (`Average 0.6 of 10`), not `len(criteria)`.
- **Display metadata lives in `QUESTIONS_TAXONOMY` only**: `title`, `labels` (choice keys → human names), `scale`, `bands`. The decision APIs reject unknown question fields with a 422 `Extra inputs are not permitted`, so the payload sent to Clef/TypeSafe is built by `model_questions()`, which keeps only `type` / `instructions` / `criteria`. Add a display field → nothing else changes; the strip point already exists.

Plus the last-run receipt the run bar prints: `items`, `seconds`, `cost_usd`, `model`. The receipt lives client-side (localStorage run log, last 50 runs) because `POST /api/email-triage/categorize` reports `categorized_count` + `duration_sec` but no cost; cost appears only when a price is substantiated — never estimated into the sentence.

## Build checklist

1. **Load the reference** — open `reference/01-tab-email-full-shell.png` and name the four shell zones before writing markup.
2. **Render the rail from `QUESTIONS_TAXONOMY`** — done when adding a taxonomy key changes the rail with no edit to `index.html`, and the display fields it carries (`title`, `labels`, `scale`, `bands`) are stripped from the model payload by `model_questions()`.
3. **Wire the grid to the aggregate payload** — done when each card's counts sum to the sample size and `Show N more` expands in place.
4. **Make rows drill through** — done when clicking `Yes` narrows the table, the row shows active state, and a second click clears it.
5. **Ship the run bar** — done when the status sentence reports progress, the receipt prints time + cost after a run, scope defaults to `Anything not sorted yet`, and Run completes a pass over the scope.
6. **Finish the table and cost modal** — done when every enabled question has a column, search narrows, Export returns CSV, and `Compare cost` shows both tables with `Against Jev`.
7. **Verify end to end** — done when the server serves `/email-triage`, the flow above works in a browser, `pytest` is green, and typecheck (if touched) passes.
