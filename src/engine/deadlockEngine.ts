/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DeadlockLab Engine — Pure, framework-free Operating System deadlock algorithms.
 * Implements Banker's Avoidance, Multi-Instance Detection (matrix reduction),
 * Single-Instance RAG cycle detection, Coffman prevention rules, and recovery actions.
 */

export interface SystemState {
  id?: string;
  name?: string;
  processes: string[];
  resources: string[];
  allocation: number[][]; // [numProcesses][numResources]
  max: number[][];        // [numProcesses][numResources]
  available: number[];    // [numResources]
  requests?: number[][];  // [numProcesses][numResources] for detection
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SafetyStep {
  stepNumber: number;
  processIndex: number;
  processName: string;
  workBefore: number[];
  need: number[];
  allocation: number[];
  workAfter: number[];
  canFinish: boolean;
  explanation: string;
}

export interface SafetyResult {
  safe: boolean;
  sequence: number[];
  sequenceNames: string[];
  steps: SafetyStep[];
  workHistory: number[][];
  explanation: string;
}

export interface RequestStage {
  stageNumber: number;
  title: string;
  passed: boolean;
  code: 'SYNTAX' | 'CLAIM_LIMIT' | 'AVAILABILITY' | 'SAFETY';
  statusLabel: 'PASSED' | 'FAILED' | 'WAITING' | 'DENIED';
  details: string;
}

export interface RequestResult {
  status: 'GRANTED' | 'WAITING' | 'DENIED_UNSAFE' | 'INVALID_INPUT';
  stages: RequestStage[];
  tentativeState?: SystemState;
  finalState: SystemState;
  safetyResult?: SafetyResult;
  message: string;
  explanation: string;
  rolledBack: boolean;
}

export interface DetectionStep {
  stepNumber: number;
  processIndex: number;
  processName: string;
  workBefore: number[];
  request: number[];
  allocation: number[];
  workAfter: number[];
  finished: boolean;
  explanation: string;
}

export interface DetectionResult {
  deadlocked: boolean;
  deadlockedProcesses: string[];
  deadlockedIndices: number[];
  steps: DetectionStep[];
  workHistory: number[][];
  initialZerosFinished: string[];
  explanation: string;
}

export interface RAGNode {
  id: string;
  type: 'process' | 'resource';
  name: string;
  instances?: number; // for resources
  x: number;
  y: number;
}

export interface RAGEdge {
  id: string;
  from: string; // node id
  to: string;   // node id
  type: 'assignment' | 'request'; // assignment: resource -> process; request: process -> resource
}

export interface RAGGraph {
  nodes: RAGNode[];
  edges: RAGEdge[];
}

export interface SingleInstanceCycleResult {
  hasCycle: boolean;
  cycles: string[][]; // array of node IDs forming cycles
  cycleDescriptions: string[];
  isDeadlock: boolean;
  explanation: string;
}

// ---------------------------------------------------------------------------
// 1. Matrix and Vector Helpers
// ---------------------------------------------------------------------------

export function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map(row => [...row]);
}

export function cloneVector(vector: number[]): number[] {
  return [...vector];
}

export function cloneState(state: SystemState): SystemState {
  return {
    id: state.id,
    name: state.name,
    processes: [...state.processes],
    resources: [...state.resources],
    allocation: cloneMatrix(state.allocation),
    max: cloneMatrix(state.max),
    available: cloneVector(state.available),
    requests: state.requests ? cloneMatrix(state.requests) : undefined,
  };
}

export function vectorAdd(a: number[], b: number[]): number[] {
  return a.map((val, i) => val + (b[i] ?? 0));
}

export function vectorSub(a: number[], b: number[]): number[] {
  return a.map((val, i) => val - (b[i] ?? 0));
}

export function vectorLeq(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 2. Need Computation & State Validation
// ---------------------------------------------------------------------------

/**
 * Computes Need = Max - Allocation.
 * Automatically marks negative values as invalid.
 */
export function computeNeed(max: number[][], alloc: number[][]): number[][] {
  const n = max.length;
  const need: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    const m = max[i]?.length ?? 0;
    for (let j = 0; j < m; j++) {
      const maxVal = max[i]?.[j] ?? 0;
      const allocVal = alloc[i]?.[j] ?? 0;
      row.push(maxVal - allocVal);
    }
    need.push(row);
  }
  return need;
}

/**
 * Validates system matrices and constraints.
 */
export function validateState(
  alloc: number[][],
  max: number[][],
  avail: number[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const n = alloc.length;
  if (n === 0) {
    errors.push('The system must have at least one process.');
    return { valid: false, errors, warnings };
  }

  const m = avail.length;
  if (m === 0) {
    errors.push('The system must define at least one resource type.');
    return { valid: false, errors, warnings };
  }

  if (max.length !== n) {
    errors.push(`Row count mismatch: Allocation has ${n} rows but Max has ${max.length}.`);
  }

  // Check row lengths and non-negative values
  for (let i = 0; i < n; i++) {
    if (!alloc[i] || alloc[i].length !== m) {
      errors.push(`Process P${i} Allocation vector length (${alloc[i]?.length || 0}) does not match resource count (${m}).`);
    }
    if (!max[i] || max[i].length !== m) {
      errors.push(`Process P${i} Max vector length (${max[i]?.length || 0}) does not match resource count (${m}).`);
    }

    for (let j = 0; j < m; j++) {
      const a = alloc[i]?.[j] ?? 0;
      const mx = max[i]?.[j] ?? 0;

      if (!Number.isInteger(a) || a < 0) {
        errors.push(`P${i} Allocation for resource R${j} must be a non-negative integer (found ${a}).`);
      }
      if (!Number.isInteger(mx) || mx < 0) {
        errors.push(`P${i} Max for resource R${j} must be a non-negative integer (found ${mx}).`);
      }
      if (a > mx) {
        errors.push(`Invalid setup: P${i} Allocation [${a}] exceeds Max demand [${mx}] for resource R${j}.`);
      }
    }
  }

  // Check available vector
  for (let j = 0; j < m; j++) {
    const av = avail[j];
    if (!Number.isInteger(av) || av < 0) {
      errors.push(`Available instance count for resource R${j} must be a non-negative integer (found ${av}).`);
    }
  }

  // Zero available is valid (edge case) but note it as a warning if all zero
  if (avail.every(v => v === 0)) {
    warnings.push('All resources currently have zero Available instances. This is a valid state but may block processes.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// 3. Banker's Algorithm: Safety Check
// ---------------------------------------------------------------------------

/**
 * Runs the safety algorithm.
 * Returns whether a safe sequence exists, the exact step-by-step Work updates,
 * and a human explanation.
 */
export function safetyCheck(
  avail: number[],
  alloc: number[][],
  need: number[][],
  processNames?: string[]
): SafetyResult {
  const n = alloc.length;
  const m = avail.length;
  const names = processNames || Array.from({ length: n }, (_, i) => `P${i}`);

  const work = [...avail];
  const finish = Array(n).fill(false);
  const sequence: number[] = [];
  const sequenceNames: string[] = [];
  const steps: SafetyStep[] = [];
  const workHistory: number[][] = [[...work]];

  let foundProcess = true;
  let stepNumber = 1;
  let lastIndex = 0;

  while (foundProcess) {
    foundProcess = false;

    // Scan circularly starting from (lastIndex + 1) to match standard textbook round-robin order
    for (let offset = 0; offset < n; offset++) {
      const i = (lastIndex + offset) % n;
      if (!finish[i]) {
        const pNeed = need[i] || [];
        const pAlloc = alloc[i] || [];

        // Check if Need_i <= Work
        if (vectorLeq(pNeed, work)) {
          const workBefore = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += pAlloc[j] ?? 0;
          }
          finish[i] = true;
          sequence.push(i);
          sequenceNames.push(names[i]);

          const workAfter = [...work];
          workHistory.push([...workAfter]);

          steps.push({
            stepNumber: stepNumber++,
            processIndex: i,
            processName: names[i],
            workBefore,
            need: [...pNeed],
            allocation: [...pAlloc],
            workAfter,
            canFinish: true,
            explanation: `Need [${pNeed.join(', ')}] ≤ Work [${workBefore.join(', ')}]. ${names[i]} can complete and releases [${pAlloc.join(', ')}], updating Work to [${workAfter.join(', ')}].`,
          });

          lastIndex = (i + 1) % n;
          foundProcess = true;
          break;
        }
      }
    }
  }

  const safe = finish.every(Boolean);

  let explanation = '';
  if (safe) {
    explanation = `The system is in a SAFE state. A complete safe execution sequence exists: <${sequenceNames.join(', ')}>. All processes can finish their execution without deadlock.`;
  } else {
    const unfinished = names.filter((_, i) => !finish[i]);
    explanation = `The system is in an UNSAFE state. No remaining process can satisfy its Need with current Work [${work.join(', ')}]. Unfinished processes: {${unfinished.join(', ')}}. Note: An unsafe state is NOT necessarily deadlocked; it simply cannot guarantee avoidance.`;
  }

  return {
    safe,
    sequence,
    sequenceNames,
    steps,
    workHistory,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// 4. Banker's Algorithm: Resource Request Checker (4 Stages + Rollback)
// ---------------------------------------------------------------------------

/**
 * Validates a resource request for a given process through 4 visible stages:
 * Stage 1: Syntax & ID validation
 * Stage 2: Request <= Need (exceeded claim error)
 * Stage 3: Request <= Available (waiting/deferred state, state unchanged)
 * Stage 4: Tentative allocation & Safety Check (Safe -> GRANTED; Unsafe -> DENIED with rollback)
 */
export function requestCheck(
  processIndex: number,
  requestVector: number[],
  state: SystemState
): RequestResult {
  const originalState = cloneState(state);
  const n = state.processes.length;
  const m = state.resources.length;
  const processName = state.processes[processIndex] ?? `P${processIndex}`;

  const stages: RequestStage[] = [];

  // Stage 1: Input Syntax and Process ID
  const isProcessValid = Number.isInteger(processIndex) && processIndex >= 0 && processIndex < n;
  const isVectorLengthValid = requestVector.length === m;
  const isVectorIntegers = requestVector.every(v => Number.isInteger(v) && v >= 0);

  if (!isProcessValid || !isVectorLengthValid || !isVectorIntegers) {
    let detail = '';
    if (!isProcessValid) detail = `Process ID ${processIndex} is out of bounds [0, ${n - 1}].`;
    else if (!isVectorLengthValid) detail = `Request vector length (${requestVector.length}) does not match resource count (${m}).`;
    else detail = 'Request vector contains negative or non-integer values.';

    stages.push({
      stageNumber: 1,
      title: 'Input & Range Validation',
      passed: false,
      code: 'SYNTAX',
      statusLabel: 'FAILED',
      details: detail,
    });

    return {
      status: 'INVALID_INPUT',
      stages,
      finalState: originalState,
      message: `Invalid input: ${detail}`,
      explanation: 'Request rejected at Stage 1 due to malformed parameters.',
      rolledBack: false,
    };
  }

  stages.push({
    stageNumber: 1,
    title: 'Input & Range Validation',
    passed: true,
    code: 'SYNTAX',
    statusLabel: 'PASSED',
    details: `Valid process ${processName} and non-negative request vector [${requestVector.join(', ')}].`,
  });

  // Calculate Need
  const need = computeNeed(state.max, state.allocation);
  const pNeed = need[processIndex];

  // Stage 2: Request <= Need
  if (!vectorLeq(requestVector, pNeed)) {
    const detail = `Request [${requestVector.join(', ')}] exceeds remaining Need [${pNeed.join(', ')}] for ${processName}.`;
    stages.push({
      stageNumber: 2,
      title: 'Maximum Claim Limit Check (Request ≤ Need)',
      passed: false,
      code: 'CLAIM_LIMIT',
      statusLabel: 'FAILED',
      details: detail,
    });

    return {
      status: 'INVALID_INPUT',
      stages,
      finalState: originalState,
      message: `Error: Process ${processName} has exceeded its maximum declared claim! (${detail})`,
      explanation: `Processes may never request more resources than their declared maximum need. Request denied as invalid.`,
      rolledBack: false,
    };
  }

  stages.push({
    stageNumber: 2,
    title: 'Maximum Claim Limit Check (Request ≤ Need)',
    passed: true,
    code: 'CLAIM_LIMIT',
    statusLabel: 'PASSED',
    details: `Request [${requestVector.join(', ')}] is within remaining Need [${pNeed.join(', ')}].`,
  });

  // Stage 3: Request <= Available
  if (!vectorLeq(requestVector, state.available)) {
    const detail = `Request [${requestVector.join(', ')}] exceeds currently Available resources [${state.available.join(', ')}].`;
    stages.push({
      stageNumber: 3,
      title: 'Availability Check (Request ≤ Available)',
      passed: false,
      code: 'AVAILABILITY',
      statusLabel: 'WAITING',
      details: detail,
    });

    return {
      status: 'WAITING',
      stages,
      finalState: originalState,
      message: `${processName} must wait: insufficient available resources. State remains unchanged.`,
      explanation: `The request cannot be granted immediately because the system does not currently have enough free resources. This is normal deferred waiting, NOT an error or invalid input.`,
      rolledBack: false,
    };
  }

  stages.push({
    stageNumber: 3,
    title: 'Availability Check (Request ≤ Available)',
    passed: true,
    code: 'AVAILABILITY',
    statusLabel: 'PASSED',
    details: `Requested [${requestVector.join(', ')}] ≤ Available [${state.available.join(', ')}]. Tentative simulation proceeds.`,
  });

  // Stage 4: Tentative Allocation & Safety Check
  const tentativeState = cloneState(state);
  for (let j = 0; j < m; j++) {
    const req = requestVector[j];
    tentativeState.available[j] -= req;
    tentativeState.allocation[processIndex][j] += req;
  }
  const tentativeNeed = computeNeed(tentativeState.max, tentativeState.allocation);

  const safety = safetyCheck(
    tentativeState.available,
    tentativeState.allocation,
    tentativeNeed,
    tentativeState.processes
  );

  if (safety.safe) {
    stages.push({
      stageNumber: 4,
      title: 'Banker’s Safety Check',
      passed: true,
      code: 'SAFETY',
      statusLabel: 'PASSED',
      details: `Tentative state is SAFE! Sequence found: <${safety.sequenceNames.join(', ')}>.`,
    });

    return {
      status: 'GRANTED',
      stages,
      tentativeState,
      finalState: tentativeState,
      safetyResult: safety,
      message: `Request GRANTED for ${processName}. System remains in a safe state with sequence <${safety.sequenceNames.join(', ')}>.`,
      explanation: `Granting [${requestVector.join(', ')}] to ${processName} preserves system safety. The new allocation is permanently committed.`,
      rolledBack: false,
    };
  } else {
    stages.push({
      stageNumber: 4,
      title: 'Banker’s Safety Check',
      passed: false,
      code: 'SAFETY',
      statusLabel: 'DENIED',
      details: `Tentative state is UNSAFE! No complete safe sequence exists. Rolling back allocation.`,
    });

    return {
      status: 'DENIED_UNSAFE',
      stages,
      tentativeState,
      finalState: originalState,
      safetyResult: safety,
      message: `Request DENIED for ${processName}: would lead to an UNSAFE state. Allocation rolled back to original.`,
      explanation: `Although resources were available, granting this request would leave the system unable to guarantee that all processes could complete under peak demand. The Banker's Algorithm denies the request and restores the original state. Crucial principle: Unsafe does not mean currently deadlocked.`,
      rolledBack: true,
    };
  }
}

// ---------------------------------------------------------------------------
// 5. Deadlock Detection (Multi-Instance Matrix Reduction)
// ---------------------------------------------------------------------------

/**
 * Multi-instance deadlock detection algorithm.
 * Inputs: Available, Allocation, Request (not Need).
 * Algorithm:
 * 1. Work = Available
 * 2. Finish[i] = true if Allocation[i] is all zero, else false
 * 3. Find unfinished i with Request[i] <= Work. If found, Work += Allocation[i], Finish[i] = true.
 * 4. At end, any unfinished process is deadlocked!
 */
export function detectMultiInstance(
  available: number[],
  allocation: number[][],
  requests: number[][],
  processNames?: string[]
): DetectionResult {
  const n = allocation.length;
  const m = available.length;
  const names = processNames || Array.from({ length: n }, (_, i) => `P${i}`);

  const work = [...available];
  const finish = Array(n).fill(false);
  const steps: DetectionStep[] = [];
  const workHistory: number[][] = [[...work]];
  const initialZerosFinished: string[] = [];

  // Step 1: Processes holding no resources can finish trivially
  for (let i = 0; i < n; i++) {
    const isZeroAlloc = (allocation[i] || []).every(v => v === 0);
    if (isZeroAlloc) {
      finish[i] = true;
      initialZerosFinished.push(names[i]);
    }
  }

  let found = true;
  let stepNumber = 1;

  while (found) {
    found = false;

    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        const pReq = requests[i] || [];
        const pAlloc = allocation[i] || [];

        if (vectorLeq(pReq, work)) {
          const workBefore = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += pAlloc[j] ?? 0;
          }
          finish[i] = true;

          const workAfter = [...work];
          workHistory.push([...workAfter]);

          steps.push({
            stepNumber: stepNumber++,
            processIndex: i,
            processName: names[i],
            workBefore,
            request: [...pReq],
            allocation: [...pAlloc],
            workAfter,
            finished: true,
            explanation: `Request [${pReq.join(', ')}] ≤ Work [${workBefore.join(', ')}]. ${names[i]} can satisfy its request, finish, and release its allocation [${pAlloc.join(', ')}], updating Work to [${workAfter.join(', ')}].`,
          });

          found = true;
          break;
        }
      }
    }
  }

  const deadlockedIndices: number[] = [];
  const deadlockedProcesses: string[] = [];

  for (let i = 0; i < n; i++) {
    if (!finish[i]) {
      deadlockedIndices.push(i);
      deadlockedProcesses.push(names[i]);
    }
  }

  const deadlocked = deadlockedProcesses.length > 0;

  let explanation = '';
  if (deadlocked) {
    explanation = `DEADLOCK DETECTED! Processes {${deadlockedProcesses.join(', ')}} are deadlocked. None of their requests can be satisfied by the remaining Work [${work.join(', ')}].`;
  } else {
    explanation = `NO DEADLOCK DETECTED. All processes can successfully complete under their current request profile.`;
  }

  return {
    deadlocked,
    deadlockedProcesses,
    deadlockedIndices,
    steps,
    workHistory,
    initialZerosFinished,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// 6. Deadlock Detection (Single-Instance / RAG Cycle Finder)
// ---------------------------------------------------------------------------

/**
 * Searches for cycles in a directed graph using DFS.
 * For single-instance resources, a cycle is necessary and sufficient for deadlock.
 * For multi-instance resources, a cycle is necessary but NOT sufficient.
 */
export function detectSingleInstance(graph: RAGGraph): SingleInstanceCycleResult {
  const adj = new Map<string, string[]>();
  graph.nodes.forEach(node => adj.set(node.id, []));

  graph.edges.forEach(edge => {
    const list = adj.get(edge.from);
    if (list) list.push(edge.to);
  });

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  graph.nodes.forEach(node => visited.set(node.id, 0));

  const cycles: string[][] = [];
  const parent = new Map<string, string | null>();

  function dfs(curr: string, path: string[]) {
    visited.set(curr, 1);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      if (visited.get(next) === 1) {
        // Cycle found
        const cycleStartIndex = path.indexOf(next);
        if (cycleStartIndex !== -1) {
          const cycle = path.slice(cycleStartIndex);
          cycles.push([...cycle, next]);
        }
      } else if (visited.get(next) === 0) {
        dfs(next, path);
      }
    }

    path.pop();
    visited.set(curr, 2);
  }

  graph.nodes.forEach(node => {
    if (visited.get(node.id) === 0) {
      dfs(node.id, []);
    }
  });

  const hasCycle = cycles.length > 0;

  // Format cycle descriptions
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const cycleDescriptions = cycles.map(cycle => {
    const names = cycle.map(id => nodeMap.get(id)?.name || id);
    return names.join(' → ');
  });

  // Check if any resource has > 1 instances
  const hasMultiInstance = graph.nodes.some(
    n => n.type === 'resource' && (n.instances ?? 1) > 1
  );

  let explanation = '';
  let isDeadlock = false;

  if (!hasCycle) {
    explanation = 'No directed cycles detected. The system is completely free of circular waiting.';
    isDeadlock = false;
  } else if (!hasMultiInstance) {
    explanation = `CYCLE DETECTED in single-instance graph: ${cycleDescriptions[0]}. In a single-instance system, a cycle is necessary AND sufficient for deadlock. The system is DEADLOCKED.`;
    isDeadlock = true;
  } else {
    explanation = `CYCLE DETECTED in multi-instance graph: ${cycleDescriptions[0]}. Important theorem: In multi-instance systems, a cycle is NECESSARY but NOT SUFFICIENT for deadlock. Must run matrix reduction detection to confirm!`;
    isDeadlock = false; // Cannot conclude deadlock from cycle alone
  }

  return {
    hasCycle,
    cycles,
    cycleDescriptions,
    isDeadlock,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// 7. Deadlock Prevention: Ordering & Admission Gate
// ---------------------------------------------------------------------------

/**
 * Resource Ordering Policy (Havender's / Coffman's Circular Wait Prevention).
 * Ranks resources 1..M. A process holding a set of resources with max rank R
 * can only request resources of rank > R.
 */
export function checkOrdering(
  heldRanks: number[],
  requestedRank: number,
  resourceName: string
): { allowed: boolean; violationRank?: number; ruleExplanation: string } {
  if (heldRanks.length === 0) {
    return {
      allowed: true,
      ruleExplanation: `No resources currently held. Request for ${resourceName} (Rank ${requestedRank}) is permitted.`,
    };
  }

  const maxHeld = Math.max(...heldRanks);
  if (requestedRank <= maxHeld) {
    return {
      allowed: false,
      violationRank: maxHeld,
      ruleExplanation: `POLICY VIOLATION: Process currently holds a resource with Rank ${maxHeld}. It cannot request ${resourceName} (Rank ${requestedRank}) because requested rank must be strictly higher (${requestedRank} ≤ ${maxHeld}). This rule prevents circular wait.`,
    };
  }

  return {
    allowed: true,
    ruleExplanation: `PERMITTED: Requested rank ${requestedRank} > maximum held rank ${maxHeld}. Strict ordering maintained.`,
  };
}

/**
 * Request-all-before-execution policy (Hold & Wait Prevention).
 * All-or-nothing admission gate.
 */
export function admissionGate(
  demand: number[],
  available: number[],
  processName: string
): { admitted: boolean; missingResources: number[]; reason: string } {
  const missingResources: number[] = [];
  for (let j = 0; j < demand.length; j++) {
    if (demand[j] > available[j]) {
      missingResources.push(j);
    }
  }

  if (missingResources.length === 0) {
    return {
      admitted: true,
      missingResources: [],
      reason: `ADMITTED: All required resources [${demand.join(', ')}] are available. ${processName} is allocated all resources simultaneously, completely preventing Hold and Wait.`,
    };
  } else {
    return {
      admitted: false,
      missingResources,
      reason: `GATE BLOCKED: Cannot satisfy entire claim [${demand.join(', ')}] (insufficient resources for indices: ${missingResources.join(', ')}). Under all-or-nothing policy, ${processName} holds zero resources while waiting.`,
    };
  }
}

// ---------------------------------------------------------------------------
// 8. Deadlock Recovery Actions
// ---------------------------------------------------------------------------

/**
 * Victim Termination: Aborts a process and returns its allocated resources to Available.
 */
export function terminateProcess(
  state: SystemState,
  processIndex: number
): { newState: SystemState; releasedResources: number[]; victimName: string } {
  const newState = cloneState(state);
  const victimName = newState.processes[processIndex] || `P${processIndex}`;
  const releasedResources = [...newState.allocation[processIndex]];

  // Release allocation into Available
  for (let j = 0; j < newState.resources.length; j++) {
    newState.available[j] += releasedResources[j];
    newState.allocation[processIndex][j] = 0;
    newState.max[processIndex][j] = 0;
    if (newState.requests) {
      newState.requests[processIndex][j] = 0;
    }
  }

  return {
    newState,
    releasedResources,
    victimName,
  };
}

/**
 * Resource Preemption: Reclaims specific instances from a process and adds to Available.
 */
export function preemptResource(
  state: SystemState,
  fromProcessIndex: number,
  resourceIndex: number,
  amount: number
): { newState: SystemState; preemptedAmount: number; processName: string } {
  const newState = cloneState(state);
  const processName = newState.processes[fromProcessIndex] || `P${fromProcessIndex}`;
  const currentAlloc = newState.allocation[fromProcessIndex][resourceIndex];
  const actualAmount = Math.min(amount, currentAlloc);

  newState.allocation[fromProcessIndex][resourceIndex] -= actualAmount;
  newState.available[resourceIndex] += actualAmount;

  return {
    newState,
    preemptedAmount: actualAmount,
    processName,
  };
}

// ---------------------------------------------------------------------------
// 9. Standard Presets (Textbook Silberschatz & Assignment Scenarios)
// ---------------------------------------------------------------------------

export const PRESET_TEXTBOOK_SAFE: SystemState = {
  id: 'silberschatz-safe',
  name: 'Textbook Safe Baseline (Silberschatz)',
  processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
  resources: ['A', 'B', 'C'],
  allocation: [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
    [2, 1, 1], // P3
    [0, 0, 2], // P4
  ],
  max: [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
    [2, 2, 2], // P3
    [4, 3, 3], // P4
  ],
  available: [3, 3, 2],
  requests: [
    [0, 0, 0],
    [1, 0, 2],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
};

export const PRESET_TEXTBOOK_DEADLOCK: SystemState = {
  id: 'silberschatz-deadlock',
  name: 'Textbook Deadlock Detection Case',
  processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
  resources: ['A', 'B', 'C'],
  allocation: [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 3], // P2
    [2, 1, 1], // P3
    [0, 0, 2], // P4
  ],
  max: [
    [0, 1, 0],
    [4, 0, 2],
    [3, 0, 4],
    [3, 1, 1],
    [0, 0, 4],
  ],
  available: [0, 0, 0],
  requests: [
    [0, 0, 0], // P0
    [2, 0, 2], // P1
    [0, 0, 1], // P2
    [1, 0, 0], // P3
    [0, 0, 2], // P4
  ],
};

export const PRESET_DETECTION_SAFE_VARIANT: SystemState = {
  id: 'detection-safe-variant',
  name: 'Detection Safe Variant (P2 Request [0,0,0])',
  processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
  resources: ['A', 'B', 'C'],
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 3],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [0, 1, 0],
    [4, 0, 2],
    [3, 0, 4],
    [3, 1, 1],
    [0, 0, 4],
  ],
  available: [0, 0, 0],
  requests: [
    [0, 0, 0],
    [2, 0, 2],
    [0, 0, 0], // P2 has zero request, can finish and release!
    [1, 0, 0],
    [0, 0, 2],
  ],
};

export const PRESET_CYCLE_NOT_DEADLOCK_RAG: RAGGraph = {
  nodes: [
    { id: 'P1', type: 'process', name: 'P1', x: 180, y: 120 },
    { id: 'P2', type: 'process', name: 'P2', x: 380, y: 120 },
    { id: 'P3', type: 'process', name: 'P3', x: 180, y: 320 },
    { id: 'P4', type: 'process', name: 'P4', x: 380, y: 320 },
    { id: 'R1', type: 'resource', name: 'R1 (2 inst)', instances: 2, x: 280, y: 120 },
    { id: 'R2', type: 'resource', name: 'R2 (2 inst)', instances: 2, x: 280, y: 320 },
  ],
  edges: [
    { id: 'e1', from: 'R1', to: 'P1', type: 'assignment' },
    { id: 'e2', from: 'P1', to: 'R2', type: 'request' },
    { id: 'e3', from: 'R2', to: 'P2', type: 'assignment' },
    { id: 'e4', from: 'P2', to: 'R1', type: 'request' },
    { id: 'e5', from: 'R1', to: 'P3', type: 'assignment' }, // P3 holds R1 but requests nothing!
    { id: 'e6', from: 'R2', to: 'P4', type: 'assignment' }, // P4 holds R2 but requests nothing!
  ],
};

export const PRESET_SINGLE_INSTANCE_DEADLOCK_RAG: RAGGraph = {
  nodes: [
    { id: 'P1', type: 'process', name: 'P1', x: 200, y: 150 },
    { id: 'P2', type: 'process', name: 'P2', x: 400, y: 150 },
    { id: 'R1', type: 'resource', name: 'Printer (R1)', instances: 1, x: 200, y: 280 },
    { id: 'R2', type: 'resource', name: 'Scanner (R2)', instances: 1, x: 400, y: 280 },
  ],
  edges: [
    { id: 'e1', from: 'R1', to: 'P1', type: 'assignment' }, // P1 holds Printer
    { id: 'e2', from: 'R2', to: 'P2', type: 'assignment' }, // P2 holds Scanner
    { id: 'e3', from: 'P1', to: 'R2', type: 'request' },    // P1 requests Scanner
    { id: 'e4', from: 'P2', to: 'R1', type: 'request' },    // P2 requests Printer
  ],
};

// ---------------------------------------------------------------------------
// 10. Seeded Pseudo-Random Problem Generator
// ---------------------------------------------------------------------------

class Mulberry32 {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function generateProblem(
  numProcesses: number,
  numResources: number,
  targetType: 'SAFE' | 'UNSAFE' | 'DEADLOCK' | 'RANDOM',
  seed: number = 42
): SystemState {
  const rng = new Mulberry32(seed);
  const n = Math.max(2, Math.min(10, numProcesses));
  const m = Math.max(1, Math.min(6, numResources));

  const processes = Array.from({ length: n }, (_, i) => `P${i}`);
  const resourceNames = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, m);

  if (targetType === 'SAFE') {
    // Construct guaranteed safe state
    const allocation: number[][] = [];
    const max: number[][] = [];
    const available: number[] = Array.from({ length: m }, () => rng.nextInt(2, 4));

    for (let i = 0; i < n; i++) {
      const aRow: number[] = [];
      const mRow: number[] = [];
      for (let j = 0; j < m; j++) {
        const allocVal = rng.nextInt(0, 2);
        const extraNeed = rng.nextInt(0, 3);
        aRow.push(allocVal);
        mRow.push(allocVal + extraNeed);
      }
      allocation.push(aRow);
      max.push(mRow);
    }

    const state: SystemState = {
      id: `gen-safe-${seed}`,
      name: `Generated Safe State (Seed: ${seed})`,
      processes,
      resources: resourceNames,
      allocation,
      max,
      available,
    };

    // Verify it is safe; if not, boost available until safe
    let safety = safetyCheck(state.available, state.allocation, computeNeed(state.max, state.allocation));
    let attempts = 0;
    while (!safety.safe && attempts < 10) {
      for (let j = 0; j < m; j++) state.available[j] += 1;
      safety = safetyCheck(state.available, state.allocation, computeNeed(state.max, state.allocation));
      attempts++;
    }
    return state;
  }

  if (targetType === 'DEADLOCK') {
    // Generate state with circular waiting requests and 0 available
    const allocation: number[][] = [];
    const max: number[][] = [];
    const requests: number[][] = [];
    const available = Array(m).fill(0);

    for (let i = 0; i < n; i++) {
      const aRow = Array(m).fill(0);
      const rRow = Array(m).fill(0);
      // Give P_i some of resource i % m
      aRow[i % m] = rng.nextInt(1, 3);
      // P_i requests resource (i+1) % m
      rRow[(i + 1) % m] = rng.nextInt(1, 2);

      allocation.push(aRow);
      max.push([...aRow]);
      requests.push(rRow);
    }

    return {
      id: `gen-deadlock-${seed}`,
      name: `Generated Deadlock State (Seed: ${seed})`,
      processes,
      resources: resourceNames,
      allocation,
      max,
      available,
      requests,
    };
  }

  // Random or Unsafe
  const allocation: number[][] = [];
  const max: number[][] = [];
  const available: number[] = Array.from({ length: m }, () => rng.nextInt(0, 3));

  for (let i = 0; i < n; i++) {
    const aRow: number[] = [];
    const mRow: number[] = [];
    for (let j = 0; j < m; j++) {
      const a = rng.nextInt(0, 3);
      const mx = a + rng.nextInt(0, 4);
      aRow.push(a);
      mRow.push(mx);
    }
    allocation.push(aRow);
    max.push(mRow);
  }

  return {
    id: `gen-random-${seed}`,
    name: `Generated Problem (Seed: ${seed})`,
    processes,
    resources: resourceNames,
    allocation,
    max,
    available,
  };
}
