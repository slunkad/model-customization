# Frontend Spec — Model Customization Platform

> **Single source of truth for all frontend decisions.**
> Before making any frontend change, update this file first.
> Use `[ ]` / `[x]` checkboxes to track build progress.

---

## Tech Stack

- **Next.js 14** (App Router)
- **React** with client-side state (useState / useReducer)
- **Tailwind CSS**
- **shadcn/ui** — component library
- **Recharts** — evaluation results charts
- **Mock data only** — no real API calls, no backend
- **Session persistence** — experiments created during the session are stored in `localStorage` and survive page refresh; seeded with 3 mock experiments on first load. Implemented via `ExperimentsContext` (React context + localStorage).

---

## High-Level Navigation Flow

```
Experiments List (/)
  │
  └─► Experiment Detail /experiments/[id]   (split view)
        Left panel: Runs list
        Right panel: Selected run's pipeline
                [Customization] → [Inference] → [Evaluation]
                      ▲                               │
                      └──────── iterate ──────────────┘
                      (tweak config, re-run from any step)
        OR
        [+ New Run] → Run Wizard /experiments/[id]/runs/new
```

**Two levels of iteration:**
1. **Within a Run** — tweak config and re-run the pipeline from any step (same Run, new iteration)
2. **New Run** — different approach entirely (e.g., switch from Prompt Customization to LoRA)

---

## Screens & Progress

### [x] 1. Experiments Dashboard — `/`
- Platform header + "New Experiment" button
- Experiment cards: name, base model, # runs, last updated, status badge
- Status badges: `Active` / `Completed` / `Draft`
- Empty state for first-time users
- Mock data: 3 experiments — "Customer Email Classifier", "Contract Summarizer", "Risk Report Generator"

---

### [x] 2. Create Experiment — `/experiments/new`
- Fields: Name (required), Description (optional), Base Model (dropdown)
- Mock model catalog: Llama-3-8B, Llama-3-70B, Mistral-7B, Falcon-40B
- Submit → redirect to `/experiments/[id]`

---

### [x] 3. Experiment Detail — `/experiments/[id]`
Split view. Left panel = runs list + New Run button. Right panel = selected run with 3 pipeline tabs.

**New Run flow:** "+ New Run" button opens a modal with a run name field + "Create Run". New run immediately appears in the runs list with status "Draft" and is auto-selected. No navigation away from this page.

**Run status model:** `Draft` → `Configuring` → `Training` → `Inferring` → `Evaluating` → `Completed` (granular per-step status)

**Tab locking:** Inference tab is locked until Customization has run. Evaluation tab is locked until Inference has run. Locked tabs show a lock icon + explanatory message.

**Unsaved changes:** Switching runs while the form is dirty triggers an AlertDialog warning.

**Tab 1 — Customization**
- **Draft runs:** Inline method picker (3 cards: Prompt Customization / Fine-tuning / Both) → select method → config form appears → "Start Customization" button → simulated training progress → unlocks Inference tab
- **Existing runs:** Editable system prompt, user/assistant templates, few-shot examples (prompt), FT method selector + hyperparameter fields (fine-tuning), "Save & Re-run" button

**Tab 2 — Inference** (locked until Customization done)
- Editable eval dataset dropdown
- "Run Inference" button → progress bar ~2s → table appears
- Table columns: # | Prompt | Ground Truth | Fine-tuned Model Response
- On completion, unlocks Evaluation tab

**Tab 3 — Evaluation** (locked until Inference done)
- Multi-select metric chips (grouped: Programmatic / LM Judges / Task-specific)
- "Run Evaluation" button → spinner → metric summary cards + comparison bar chart + error insights panel
- Re-run with different metric selection at any time

---

### [ ] 4. Run Configuration Wizard — `/experiments/[id]/runs/new` *(DEPRECATED — no longer linked)*
This page still exists on disk but is not reachable from the UI. All run configuration now happens inline on the Experiment Detail page.

---

### [x] 5. Run Detail — `/experiments/[id]/runs/[runId]`
**Inspired by H2O LLM Studio's experiment view tab structure.**

**Top:** Pipeline status bar — Customization → Inference → Evaluation (✓ / spinner / pending)

**Tabs:**
- **Charts** — training/validation loss curves + learning rate (Recharts line chart, mock data)
- **Summary** — metadata table: base model, method, dataset, epochs, metric scores
- **Data Insights** — table preview of first batch of training samples
- **Validation Insights** — side-by-side best/worst predicted samples
- **Logs** — scrollable terminal-style panel with mock timestamped log lines
- **Config** — read-only hyperparameter config used in this run
- **Chat** — text input → mock model response (playground for the customized model)

"View Results" button (in Charts/Summary tab) → navigates to evaluation results

---

### [x] 7. Standalone Evaluation — `/evaluation`

**Nav:** Left sidebar, below Experiments. Entry point for users who want to evaluate model outputs without being tied to an experiment or run.

**Input:** User provides a dataset that already contains:
- Evaluation prompts
- Model responses (from a customized model)
- Ground truth labels (optional)

No inference step — scoring only.

**Layout:** Split view
- **Left panel:** History list of past standalone eval runs; "+ New Evaluation" button at bottom
  - Each entry shows: Eval # / dataset name / date / status badge (Done / Draft)
  - History persisted to localStorage under `modelforge_eval_runs`; pre-seeded with 2 mock completed runs
- **Right panel:** Dataset selector + `<EvaluationPanel>` (shared component)
  - Draft run: dataset dropdown → once selected, EvaluationPanel renders below
  - Completed run: dataset shown as read-only chip, EvaluationPanel with `initialHasResults={true}`

**Shared component:** Uses `components/evaluation/EvaluationPanel.tsx` — same component as the Evaluation tab inside experiment runs. All UI changes must go there.

---

### [x] 6. Evaluation Results — `/experiments/[id]/runs/[runId]/results`
- **Metric summary cards**: BLEU: 0.82, ROUGE-L: 0.74, F1: 0.88, Hallucination Rate: 4.2%
- **Comparison bar chart**: base model vs. customized model per metric (Recharts)
- **Per-sample table**: Prompt | Base Response | Customized Response | Score; rows expandable
- **Error insights panel**: e.g., "12% of responses truncated", "Hallucinations concentrated in Q4 financial data"
- "Export Results" button → toast notification (no-op)

---

## Mock Data Files

| File | Contents |
|------|----------|
| `src/data/mockExperiments.ts` | 3 experiments with varied statuses |
| `src/data/mockRuns.ts` | 2–3 runs per experiment (completed + in-progress) |
| `src/data/mockResults.ts` | Evaluation scores, per-sample rows, error insights |
| `src/data/mockModels.ts` | Base model catalog |
| `src/data/mockDatasets.ts` | Sample eval/training datasets |

---

## Component Structure

```
src/
  app/
    layout.tsx                        # Root layout + sidebar
    page.tsx                          # Experiments dashboard
    experiments/
      new/page.tsx
      [id]/
        page.tsx                      # Experiment detail (split view)
        runs/
          new/page.tsx                # Run wizard
          [runId]/
            page.tsx                  # Run monitoring
            results/page.tsx          # Evaluation results
  components/
    layout/
      Sidebar.tsx
    experiments/
      ExperimentCard.tsx
    runs/
      RunWizard.tsx
      steps/
        MethodSelector.tsx
        PromptCustomization.tsx
        FineTuningConfig.tsx
        InferenceConfig.tsx
        EvaluationConfig.tsx
        ReviewLaunch.tsx
    results/
      MetricCards.tsx
      ComparisonChart.tsx
      SampleTable.tsx
      ErrorInsights.tsx
  data/
    mockExperiments.ts
    mockRuns.ts
    mockResults.ts
    mockModels.ts
    mockDatasets.ts
```

---

## Demo Walkthrough (Verification)

1. `/` → 3 experiment cards visible
2. "New Experiment" → fill form → submit → lands on experiment detail
3. Experiment detail shows split view: runs list + pipeline
4. "New Run" → 5-step wizard → "Launch Run"
5. Run monitoring → pipeline progress + logs
6. "View Results" → evaluation dashboard with charts + table
7. Breadcrumb / sidebar navigation works throughout
