# DeadlockLab — Interactive OS Deadlock Visualizer & Learning Lab

An interactive, Apple-style learning laboratory and analytical visualizer for Operating System deadlocks, designed for computer science students, software engineers, and concurrency learners.

---

## Key Features

1. **Pure Algorithmic Engine (`src/engine/deadlockEngine.ts`)**:
   - Zero framework dependencies.
   - Deterministic implementations of Dijkstra's Banker's algorithm (safety check and 4-stage request validation with rollback), Multi-Instance matrix reduction detection, Single-Instance RAG cycle detection, Coffman prevention rules (Havender resource ordering & admission gate), and recovery mechanisms.
   - Automated test runner covering all verification cases (**TC1 through TC6 + Extras**).

2. **10 Interactive Learning & Laboratory Modules**:
   - **Home**: Roadmap, 4 OS pillars, and non-interchangeable state taxonomy callouts.
   - **1. Basics**: Progressive 4-step story of Process 1, Process 2, Printer, and Scanner locking into mutual freeze, with formal OS definitions.
   - **2. Four Conditions**: Coffman conditions inspector with interactive toggle breakers that demonstrate deadlock dissolving in real time.
   - **3. Live RAG**: SVG canvas with draggable process circles and resource rectangles (with internal instance dots), live edge drawing (Assignment & Request), and animated cycle pulse highlights. Explicitly distinguishes Single-Instance ($Cycle \iff Deadlock$) vs Multi-Instance ($Cycle \not\implies Deadlock$).
   - **4. Banker’s Avoidance**: Auto-computed Need matrix ($Need = Max - Allocation$), step-by-step safety player showing dynamic Work vector updates and safe sequence derivation, plus a 4-stage request pipeline with rollback animation.
   - **5. Deadlock Detection**: Direct matrix reduction on Allocation and Request matrices to isolate stuck processes, plus single-instance Wait-For graph reduction.
   - **6. Prevention & Recovery**: Havender hierarchical resource ordering checker, All-or-Nothing admission gate, trade-off comparisons, and an interactive victim termination recovery simulator.
   - **7. Problem Lab**: Reproducible Mulberry32 seeded problem generator, 1-click 5-status analysis, cross-tab problem dispatch, and JSON import/export.
   - **8. Test Suite**: Live verification matrix with real-time engine evaluation, custom test creation, and print report export.
   - **9. Walkthrough & Guide**: 6-minute live concept demonstration timer with speaker notes, tooling & verification record, and core interview defense questions.

---

## Non-Interchangeable Status Taxonomy

- **SAFE**: At least one complete execution sequence exists under peak declared claim.
- **GRANTED**: Tentative allocation verified to preserve a safe state; permanently committed.
- **WAITING / DEFERRED**: Request exceeds currently free resources; process waits without error and state remains unchanged.
- **UNSAFE / DENIED**: Granting the request would eliminate all safe sequences. The request is denied and the tentative state is automatically rolled back.
- **DEADLOCK DETECTED**: Processes are currently waiting in an unresolvable cycle where no outstanding requests can be satisfied.
- **INVALID INPUT**: Negative values, malformed process IDs, or requests exceeding maximum declared claim.

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Run dev server on port 3000
npm run dev

# Run engine unit tests
npx tsx -e "import { runEngineTestSuite } from './src/engine/deadlockEngine.test.ts'; console.log(runEngineTestSuite());"

# Build production bundle
npm run build
```
