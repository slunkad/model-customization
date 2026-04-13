# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **end-to-end model customization platform** for non-ML engineers (application developers with strong technical backgrounds but limited ML expertise) at a financial institution. The goal is to abstract away ML infrastructure complexity so users can customize LLMs through intuitive configuration rather than writing plumbing code.

The platform leverages open-source libraries (e.g., LLaMA Factory, Axolotl) to handle fine-tuning internals, exposing only relevant configs to users.

## Core Concepts

- **Experiment**: The top-level container for a customization effort
- **Run**: A single execution within an Experiment; a pipeline of steps

## Pipeline Steps (per Run)

### Section 1 — LLM Customization (choose one or both)
- **Prompt Customization**: System prompt, user/assistant templates, few-shot examples — no parameter changes
- **Fine-tuning**: Parameter-level tuning via SFT, LoRA, QLoRA, RLHF, DPO; users only configure method-specific hyperparams (e.g., LoRA rank/alpha); plumbing is handled by the library layer

### Section 2 — Inference
- Load the customized model and run it against an evaluation dataset
- Abstracts batching, distributed inference; user provides dataset + clicks run

### Section 3 — Evaluation
- Score model responses using LM judges, programmatic metrics, and other scorers
- Outputs summary statistics and error insights to help users decide if the model meets expectations
- UX inspiration: [H2O Eval Studio](https://eval-studio.genai.h2o.ai/)

## Design References
- H2O LLM Studio for fine-tuning UX: https://github.com/h2oai/h2o-llmstudio
- H2O Eval Studio for evaluation UX: https://eval-studio.genai.h2o.ai/

## Frontend Spec

`FRONTEND_SPEC.md` is the **single source of truth** for all frontend decisions — screens, flow, component structure, and build progress.

**Rules:**
- Before making any frontend change, update `FRONTEND_SPEC.md` first
- Mark screens as complete (`[ ]` → `[x]`) as they are built
- If the user requests a change mid-build, update `FRONTEND_SPEC.md` before touching any code

## Shared Components

### EvaluationPanel (`app/components/evaluation/EvaluationPanel.tsx`)

This component is used in **two places**:
1. The Evaluation tab inside `/experiments/[id]` (gated behind Inference completion)
2. The standalone `/evaluation` page (independent of any experiment or run)

**Rule:** Any change to evaluation UI — metric chips, results cards, bar chart, per-sample table, error insights — **must be made inside `EvaluationPanel` only**. Never duplicate this logic in a page file. If a page needs different behavior, add a prop to `EvaluationPanel`.

## Current Status

All screens built. See `FRONTEND_SPEC.md` for per-screen progress tracking.
