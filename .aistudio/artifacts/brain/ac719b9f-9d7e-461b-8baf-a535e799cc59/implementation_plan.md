# DeadlockLab: Interactive Operating System Deadlock Analysis & Assignment Dashboard

An Apple-styled interactive learning and laboratory dashboard for Operating System deadlocks. It enables students to understand deadlock concepts visually within 5 minutes and fulfills all grading criteria for OS IA Assignment Activity 2 (Banker's Algorithm, Detection Reduction, RAG cycle analysis, Prevention policies, TC1–TC6 test matrix, and fillable AI Usage Record).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and architectural choices have been confirmed and will guide the build:

- **Confirmed Decision 1 (Initial System State)**: Preloaded on first load with the textbook baseline (Silberschatz 5-process, 3-resource example: $P_0$–$P_4$, Resources $A=10, B=5, C=7$, Available $[3, 3, 2]$), coupled with a 1-click Preset Selector for instant switching between Textbook Safe, Unsafe Request, Deadlocked, Single-Instance Cycle, and Empty custom template.
- **Confirmed Decision 2 (Viva & Presentation Mode)**: Embedded 6-minute oral demo timer and walkthrough guide. Includes student speaker notes, scripted demonstrations required by the rubric (Safe State, Unsafe Request, Deadlocked state, Recovery termination, Prevention comparison), and quick Q&A flashcards for exam defense.
- **Engine Architecture**: Pure framework-free algorithmic module in `src/engine/` powering all 10 tabs, guaranteeing mathematically verifiable results with zero mock/hard-coded data.

---

## 1. Overview & Core Concept

- **What It Does**: DeadlockLab transforms complex Operating System concurrency theory into tactile visual simulations. Students can drag processes and resources to form resource allocation graphs, step through Banker's safety checks row-by-row with vector animations, test real-time requests with automatic rollback on unsafe states, run multi-instance matrix reduction detection, compare prevention trade-offs, and auto-evaluate assignment test cases (TC1–TC6).
- **Target Audience**: Second- and third-year computer science students studying operating systems, lab instructors evaluating assignments, and student groups preparing for live viva demonstrations.
- **Key Value**: Rigorous distinction between key OS states that students often conflate:
  - **Safe vs. Unsafe**: An unsafe state is not automatically deadlocked; it simply cannot guarantee deadlock avoidance under maximum demand.
  - **Waiting vs. Invalid**: A request exceeding currently Available resources causes the process to wait; it is not an error or invalid input.
  - **Avoidance vs. Detection**: Banker's avoids future deadlock; detection algorithms uncover deadlocks already existing in the current state.
  - **Cycles in RAGs**: A cycle in a single-instance RAG is a necessary and sufficient condition for deadlock; in a multi-instance RAG, it is necessary but *not* sufficient.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Interactive Story (Basics Tab)**: A 4-step progressive animation featuring Process 1, Process 2, Printer, and Scanner. The user steps through sequential acquisition until circular wait locks both processes in red pulse, followed by an intuitive 1-sentence definition.
2. **Coffman's Four Conditions Tab**: Interactive inspection cards for Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Toggling any condition "OFF" immediately unblocks the resource conflict, demonstrating the core theorem that eliminating any single condition prevents deadlock.
3. **Live Resource Allocation Graph (RAG Tab)**: Canvas with draggable process circles and resource rectangles (with internal token dots for instances). Users draw request and assignment edges by clicking nodes. An embedded cycle-detector animates directed cycles with traveling pulse highlights and displays whether the cycle constitutes a deadlock (single-instance) or requires matrix reduction (multi-instance).
4. **Banker's Algorithm Player (Avoidance Tab)**:
   - *Safety Step Player*: Step forward, auto-play, or reset. Displays current `Work` vector and highlights the process where $\text{Need}_i \le \text{Work}$, animating its allocation back into `Work` and appending to the safe sequence list.
   - *4-Stage Request Pipeline*: Stage 1: Syntax & ID check $\to$ Stage 2: $\text{Request} \le \text{Need}$ (else INVALID) $\to$ Stage 3: $\text{Request} \le \text{Available}$ (else WAITING, state unchanged) $\to$ Stage 4: Tentative allocation & Safety check (Safe $\to$ GRANTED; Unsafe $\to$ DENIED with rollback animation).
5. **Detection Lab (Detection Tab)**: Matrix reduction visualizer for multi-instance resources using `Allocation`, `Request`, and `Available`. Highlights deadlocked processes in red with clear explanatory breakdown.
6. **Prevention & Recovery Lab**: Interactive resource ordering checker (hierarchy ranks) and all-or-nothing admission gate, alongside interactive recovery controls (victim termination with minimal resource cost guidance and resource preemption).
7. **Problem Lab**: Parameterized generator with reproducible seed, JSON import/export, and 1-click comprehensive analysis across all algorithms.
8. **Automated Test Suite (TC1–TC6)**: Comprehensive assignment test runner with real-time engine evaluation, custom test builder, summary copy, and print-ready formal report.
9. **Viva Walkthrough & AI Usage Record**: A 6-minute timed presentation script, Q&A viva defense flashcards, and a fillable AI Usage table matching the assignment rubric.

### Visual Identity & Theme
- **Aesthetic Direction**: Apple-style human interface design—pure white canvas, crisp hairlines, generous breathing room, refined typography, and purposeful micro-interactions.
- **Palette**:
  - Dominant Canvas: Clean White `#FFFFFF` with secondary surface `#F5F5F7`.
  - Borders & Dividers: Hairline `#E5E5EA`.
  - Primary Text: Deep Charcoal `#1D1D1F`; Muted Text: Slate `#6E6E73`.
  - Brand Accent: Apple blue `#0071E3` with subtle violet `#7C3AED` to rose `#EC4899` gradient accents on hero titles and active tab indicators.
  - Status System (Never color alone; always paired with explicit icons & text labels):
    - **SAFE / GRANTED**: Emerald `#12A150` with check icon.
    - **WAITING / DEFERRED**: Amber `#D97706` with clock/hourglass icon.
    - **UNSAFE / DENIED / DEADLOCK**: Coral Red `#E5484D` with alert triangle/ban icon.
    - **INVALID INPUT**: Charcoal Red `#991B1B` with badge icon.
- **Typography**: System font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif`), tabular numbers (`tabular-nums font-mono`) for all matrices and vectors.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Engine Purity (`src/engine/`)**:
  - *Chosen Approach*: Implement all mathematical algorithms (Banker's safety, request validator, single-instance cycle DFS, multi-instance reduction, ordering rule checker, admission gate) in pure TypeScript/JavaScript with zero React dependencies.
  - *Why*: Enables unit testing, guarantees 100% determinism, eliminates side-effects, and makes code instantly explainable during college viva examinations.
- **Decision 2: Centralized Reactive System State Store**:
  - *Chosen Approach*: A lightweight React Context / Custom Hook store holding current processes, resource instances, Allocation, Max, Available, and Request matrices.
  - *Why*: Allows seamless navigation: a problem configured in the Problem Lab or Banker's tab is immediately available in the RAG, Detection, and Prevention tabs with a single click.
- **Decision 3: Non-Destructive Request Evaluation (Rollback)**:
  - *Chosen Approach*: When a request is tested, deep-clone state, apply tentative allocation, run safety check, and visually animate the state returning to original if unsafe.
  - *Why*: Accurately demonstrates the theoretical Banker's mechanism without corrupting the active lab session.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DeadlockLab App                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Sticky Top Navigation Bar (3-Zone Apple Contract)                     │  │
│  │ [DeadlockLab Wordmark] ── [10 Tab Navigation] ── [System Status Chip] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Global System State Store (Shared across tabs, JSON exportable)       │  │
│  │ - Processes (P0..Pn)         - Resource Types (A, B, C...)            │  │
│  │ - Allocation Matrix [N x M]  - Max Demand Matrix [N x M]              │  │
│  │ - Available Vector [M]       - Request Matrix / Active Requests       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                   │                                 │                       │
│                   ▼                                 ▼                       │
│  ┌───────────────────────────────────┐ ┌───────────────────────────────────┐  │
│  │ Pure OS Engine (src/engine/)      │ │ Interactive Tab Views             │  │
│  │ • computeNeed(max, alloc)         │ │ 1. Home (Hero & Roadmap)          │  │
│  │ • validateState(alloc, max, avail)│ │ 2. Basics (Interactive Story)     │  │
│  │ • safetyCheck(avail, alloc, need) │ │ 3. Four Conditions (Toggles)      │  │
│  │ • requestCheck(pid, req, state)   │ │ 4. Live RAG (SVG Drag & Cycles)   │  │
│  │ • detectMultiInstance(...)        │ │ 5. Banker's Player (Step/Auto)    │  │
│  │ • detectSingleInstance(graph)     │ │ 6. Detection Lab (Reduction)      │  │
│  │ • checkOrdering(...)              │ │ 7. Prevention & Recovery          │  │
│  │ • admissionGate(...)              │ │ 8. Problem Lab & Generator        │  │
│  │ • terminateProcess(state, pid)    │ │ 9. Test Suite (TC1-TC6 Matrix)    │  │
│  │ • preemptResources(...)          │ │ 10. About, Viva & AI Usage Table  │  │
│  └───────────────────────────────────┘ └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Engine Function Signatures
```typescript
interface SystemState {
  processes: string[];
  resources: string[];
  allocation: number[][];
  max: number[][];
  available: number[];
}

interface SafetyResult {
  safe: boolean;
  sequence: number[];
  steps: Array<{
    processIndex: number;
    processName: string;
    workBefore: number[];
    need: number[];
    allocation: number[];
    workAfter: number[];
    canFinish: boolean;
  }>;
  explanation: string;
}

interface RequestResult {
  status: 'GRANTED' | 'WAITING' | 'DENIED_UNSAFE' | 'INVALID_INPUT';
  stageResults: Array<{
    stageNumber: number;
    title: string;
    passed: boolean;
    details: string;
  }>;
  tentativeState?: SystemState;
  finalState: SystemState;
  safetyResult?: SafetyResult;
  message: string;
}

interface DetectionResult {
  deadlocked: boolean;
  deadlockedProcesses: string[];
  steps: Array<{
    stepNumber: number;
    processIndex: number;
    processName: string;
    workBefore: number[];
    request: number[];
    allocation: number[];
    workAfter: number[];
    finished: boolean;
  }>;
  explanation: string;
}
```

---

## 5. Verification Plan

1. **Automated Unit Verification**:
   - Run tests covering TC1 (Safe state $[P_1, P_3, P_4, P_0, P_2]$), TC2 (Request $[7,4,3] \to$ WAITING), TC3 (Request $[0,0,2] \to$ UNSAFE/DENIED), TC4 (Textbook deadlock $\{P_1, P_2, P_3, P_4\}$ and 2-process circular wait), TC5 (Ordering rules & Admission gate), and TC6 (Boundary: zero Available, zero Need, negative request, request > Need, Allocation > Max).
2. **Interactive UI Verification**:
   - Confirm step-by-step playback in Banker's and Detection tabs updates vectors and displays sequence chips.
   - Confirm RAG drag-and-drop, node addition, edge creation, and cycle pulse animation work smoothly.
   - Confirm export/import JSON and 1-click preset switching update all tabs simultaneously.
   - Confirm responsive layout across 360px mobile and 1440px desktop.
   - Verify zero console warnings, full keyboard navigation, and WCAG AA contrast compliance.
