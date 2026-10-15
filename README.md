# ProofLoop

> **Autonomy you can inspect, interrupt, and prove.**

ProofLoop turns a plain-English objective into a visible, policy-aware workflow. It makes the safety boundary explicit before work runs, simulates the execution locally, and emits an evidence ledger for every decision.

## Why this is different

Most AI automation demos optimize for “the agent finished.” ProofLoop optimizes for a harder question:

> **Can a human understand, interrupt, and prove every action the automation took?**

The demo includes a deterministic local planner, first-class risk gates, a simulated execution console, and replayable evidence. It is intentionally honest about simulation mode: no external account or secret is required to evaluate the control plane.

## First demo flow

1. Enter the supplied invoice-review objective.
2. Inspect the generated plan and its policy gates.
3. Run the local simulation.
4. Expand the evidence ledger to see why one action was approved and others were blocked.
5. Export the evidence as JSON or replay the same run.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

Docker is optional. It is not required for local development.

## Setup and run

```bash
npm ci
npm start
```

Open <http://localhost:4173>.

## Test

The project uses only Node's built-in test runner and can run offline after dependencies are installed:

```bash
make test
```

On Windows without `make`, run `npm test`.

## Deploy with Docker

```bash
docker build -t proofloop .
docker run --rm -p 4173:4173 proofloop
```

## Rebuildability checklist

- `.nvmrc` pins Node 24.
- `package-lock.json` is committed even though the app has no third-party npm dependencies.
- `Dockerfile` builds and serves the same app on `node:24-alpine`.
- `npm test` is the single test command; it uses Node's built-in runner.
- `.env.example` documents the only runtime setting and contains no secret.
- All paths in source and docs are relative or container-local; no machine-specific paths are required.

## Product contract

- **Deterministic:** identical goals and fixture data produce the same plan and outcome.
- **Fail-closed:** missing identifiers, uncertain matches, and over-limit actions do not execute automatically.
- **Reversible demo:** all actions are simulated and clearly labeled.
- **Evidence-first:** blocked work is a meaningful outcome with a reason, not a silent error.

## Project status

This is a buildathon-ready local demo of the ProofLoop control plane. Integrations are deliberately kept behind a future adapter boundary so the safety model can be judged without API keys.
