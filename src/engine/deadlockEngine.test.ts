/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unit tests for DeadlockLab algorithmic engine.
 * Validates TC1 to TC6 and standard concurrency verification scenarios.
 */

import {
  PRESET_TEXTBOOK_SAFE,
  PRESET_TEXTBOOK_DEADLOCK,
  PRESET_CYCLE_NOT_DEADLOCK_RAG,
  PRESET_SINGLE_INSTANCE_DEADLOCK_RAG,
  computeNeed,
  validateState,
  safetyCheck,
  requestCheck,
  detectMultiInstance,
  detectSingleInstance,
  checkOrdering,
  admissionGate,
  terminateProcess,
  cloneState,
} from './deadlockEngine.ts';

export interface TestCaseResult {
  id: string;
  name: string;
  condition: string;
  expectedResult: string;
  actualResult: string;
  passed: boolean;
  category: 'TC1' | 'TC2' | 'TC3' | 'TC4' | 'TC5' | 'TC6' | 'EXTRA';
  analysis: string;
}

export function runEngineTestSuite(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // -------------------------------------------------------------------------
  // TC1: Safe State (Silberschatz baseline)
  // -------------------------------------------------------------------------
  {
    const state = PRESET_TEXTBOOK_SAFE;
    const need = computeNeed(state.max, state.allocation);
    const safety = safetyCheck(state.available, state.allocation, need, state.processes);
    const seqStr = safety.sequenceNames.join(', ');
    const expectedSeq = 'P1, P3, P4, P0, P2';
    const passed = safety.safe && seqStr === expectedSeq;

    results.push({
      id: 'TC1',
      name: 'TC1: Safe State Baseline',
      condition: 'Silberschatz 5 processes, Allocation P0-P4, Max P0-P4, Available [3, 3, 2]',
      expectedResult: `Safe sequence <${expectedSeq}>`,
      actualResult: safety.safe ? `Safe sequence <${seqStr}>` : 'Unsafe state detected',
      passed,
      category: 'TC1',
      analysis: 'Calculates Need = Max - Allocation. Need <= Work satisfied sequentially for P1, then P3, P4, P0, P2. Full sequence completes with zero deadlock.',
    });
  }

  // -------------------------------------------------------------------------
  // TC2: Request exceeds Available resources
  // -------------------------------------------------------------------------
  {
    const state = PRESET_TEXTBOOK_SAFE;
    // P0 requests [7, 4, 3] which equals its Need but exceeds Available [3, 3, 2]
    const req = [7, 4, 3];
    const outcome = requestCheck(0, req, state);
    const passed = outcome.status === 'WAITING' && !outcome.rolledBack;

    results.push({
      id: 'TC2',
      name: 'TC2: Request Exceeds Available',
      condition: 'P0 requests [7, 4, 3] (Need is [7, 4, 3], but Available is [3, 3, 2])',
      expectedResult: 'Request status: WAITING (deferred, state unchanged, not an error)',
      actualResult: `Request status: ${outcome.status} — ${outcome.message}`,
      passed,
      category: 'TC2',
      analysis: 'Request satisfies Stage 2 (Request <= Need) but fails Stage 3 (Request <= Available). Correctly classified as WAITING/DEFERRED without corrupting system state or throwing an error.',
    });
  }

  // -------------------------------------------------------------------------
  // TC3: Request produces an Unsafe State
  // -------------------------------------------------------------------------
  {
    const state = PRESET_TEXTBOOK_SAFE;
    // P0 requests [0, 0, 2]: within Need [7,4,3] and Available [3,3,2], but tentative available [3,3,0] makes system unsafe
    const req = [0, 0, 2];
    const outcome = requestCheck(0, req, state);
    const passed = outcome.status === 'DENIED_UNSAFE' && outcome.rolledBack;

    results.push({
      id: 'TC3',
      name: 'TC3: Request Produces Unsafe State',
      condition: 'P0 requests [0, 0, 2] from baseline (Available becomes [3, 3, 0])',
      expectedResult: 'Request status: DENIED_UNSAFE (tentative simulation fails, state rolled back)',
      actualResult: `Request status: ${outcome.status} — rolledBack=${outcome.rolledBack}`,
      passed,
      category: 'TC3',
      analysis: 'Request passes syntax, claim, and availability checks. Tentative allocation leaves Available=[3,3,0], where no process can satisfy remaining Need. System denies request and restores original state. Demonstrates that unsafe is not automatically deadlocked.',
    });
  }

  // -------------------------------------------------------------------------
  // TC4: Deadlock Detection (Multi-Instance + Single-Instance)
  // -------------------------------------------------------------------------
  {
    // Part A: Multi-instance textbook detection
    const state = PRESET_TEXTBOOK_DEADLOCK;
    const det = detectMultiInstance(state.available, state.allocation, state.requests!, state.processes);
    const deadlockedStr = det.deadlockedProcesses.sort().join(', ');
    const expectedDeadlock = 'P1, P2, P3, P4';
    const passedMulti = det.deadlocked && deadlockedStr === expectedDeadlock;

    // Part B: Single-instance 2-process circular wait
    const singleDet = detectSingleInstance(PRESET_SINGLE_INSTANCE_DEADLOCK_RAG);
    const passedSingle = singleDet.hasCycle && singleDet.isDeadlock;

    const passed = passedMulti && passedSingle;

    results.push({
      id: 'TC4',
      name: 'TC4: Deadlock Detection (Multi & Single Instance)',
      condition: 'Multi-instance textbook case (P0 requests 000, P1-P4 have cyclic demands) & 2-process RAG circular wait',
      expectedResult: `Deadlocked processes: {${expectedDeadlock}}, and single-instance cycle identified as confirmed Deadlock`,
      actualResult: `Multi: Deadlocked {${deadlockedStr}}; Single: Cycle=${singleDet.hasCycle}, Deadlock=${singleDet.isDeadlock}`,
      passed,
      category: 'TC4',
      analysis: 'Matrix reduction allows P0 to finish (request 000), leaving Work=[0,1,0]. No other process can finish, correctly isolating {P1, P2, P3, P4} as deadlocked. Single-instance RAG detects cycle P1->R2->P2->R1->P1 and confirms deadlock.',
    });
  }

  // -------------------------------------------------------------------------
  // TC5: Deadlock Prevention Policies
  // -------------------------------------------------------------------------
  {
    // Part A: Resource Ordering policy (break circular wait)
    // Holding rank 2 (e.g. Scanner=2), attempting to request rank 1 (Printer=1)
    const orderingCheck = checkOrdering([2], 1, 'Printer (Rank 1)');
    const passedOrdering = !orderingCheck.allowed && orderingCheck.violationRank === 2;

    // Part B: Request-all admission gate (break hold & wait)
    // Demanding [4, 4, 4] when available is [3, 3, 2]
    const gateCheck = admissionGate([4, 4, 4], [3, 3, 2], 'P_Test');
    const passedGate = !gateCheck.admitted && gateCheck.missingResources.length > 0;

    const passed = passedOrdering && passedGate;

    results.push({
      id: 'TC5',
      name: 'TC5: Deadlock Prevention Policies',
      condition: 'Resource ordering (hold Rank 2, request Rank 1) & Admission gate (demand [4,4,4] vs avail [3,3,2])',
      expectedResult: 'Ordering blocks lower rank request; Admission gate blocks partial acquisition',
      actualResult: `Ordering allowed=${orderingCheck.allowed}; Gate admitted=${gateCheck.admitted}`,
      passed,
      category: 'TC5',
      analysis: 'Ordering strictly enforces Havender hierarchy (requested rank must strictly exceed highest held rank), preventing circular wait. Admission gate enforces all-or-nothing allocation, preventing Hold & Wait.',
    });
  }

  // -------------------------------------------------------------------------
  // TC6: Boundary and Invalid Inputs
  // -------------------------------------------------------------------------
  {
    // 1. Zero available vector (valid boundary)
    const zeroAvailValidation = validateState([[1, 0]], [[2, 1]], [0, 0]);
    const zeroAvailOk = zeroAvailValidation.valid;

    // 2. Process with zero remaining need (valid boundary)
    const zeroNeed = computeNeed([[2, 1]], [[2, 1]]);
    const zeroNeedOk = zeroNeed[0][0] === 0 && zeroNeed[0][1] === 0;

    // 3. Invalid process ID
    const invalidPidResult = requestCheck(99, [1, 0, 0], PRESET_TEXTBOOK_SAFE);
    const invalidPidOk = invalidPidResult.status === 'INVALID_INPUT';

    // 4. Negative request vector
    const negReqResult = requestCheck(0, [-1, 0, 0], PRESET_TEXTBOOK_SAFE);
    const negReqOk = negReqResult.status === 'INVALID_INPUT';

    // 5. Request > Need (claim violation)
    const overNeedResult = requestCheck(1, [9, 9, 9], PRESET_TEXTBOOK_SAFE);
    const overNeedOk = overNeedResult.status === 'INVALID_INPUT';

    // 6. Allocation > Max (invalid system setup)
    const badSetup = validateState([[5, 0]], [[2, 0]], [1, 1]);
    const badSetupOk = !badSetup.valid && badSetup.errors.length > 0;

    // 7. Zero request (valid no-op, granted)
    const zeroReqResult = requestCheck(0, [0, 0, 0], PRESET_TEXTBOOK_SAFE);
    const zeroReqOk = zeroReqResult.status === 'GRANTED';

    const passed =
      zeroAvailOk &&
      zeroNeedOk &&
      invalidPidOk &&
      negReqOk &&
      overNeedOk &&
      badSetupOk &&
      zeroReqOk;

    results.push({
      id: 'TC6',
      name: 'TC6: Boundary & Invalid Inputs',
      condition: 'Zero available, zero need, invalid PID, negative request, claim overflow, alloc>max, zero request',
      expectedResult: 'All 7 edge cases accurately classified with explicit error / success indicators',
      actualResult: passed ? 'All 7 boundary and invalid checks succeeded' : 'Validation failure in edge cases',
      passed,
      category: 'TC6',
      analysis: 'Zero available and zero need are properly handled as valid system states. Malformed IDs, negative vectors, claim violations, and alloc>max are cleanly trapped with descriptive error messages without crashing.',
    });
  }

  // -------------------------------------------------------------------------
  // Extra 1: Granted Request (P1 requests [1, 0, 2])
  // -------------------------------------------------------------------------
  {
    const state = PRESET_TEXTBOOK_SAFE;
    const req = [1, 0, 2];
    const outcome = requestCheck(1, req, state);
    const passed = outcome.status === 'GRANTED' && !outcome.rolledBack;

    results.push({
      id: 'EXTRA_1',
      name: 'Extra: Safe Request Granted (P1 [1, 0, 2])',
      condition: 'P1 requests [1, 0, 2] from baseline (Need=[1,2,2], Avail=[3,3,2])',
      expectedResult: 'Request status: GRANTED; allocation permanently updated; safe sequence maintained',
      actualResult: `Status: ${outcome.status} — ${outcome.message}`,
      passed,
      category: 'EXTRA',
      analysis: 'Request is within Need [1,2,2] and Available [3,3,2]. Tentative Available [2,3,0] remains safe (P1 finishes first, yielding Work [4,3,2], allowing P3, P4, P0, P2 to complete). State committed.',
    });
  }

  // -------------------------------------------------------------------------
  // Extra 2: Multi-Instance Cycle But No Deadlock
  // -------------------------------------------------------------------------
  {
    const graph = PRESET_CYCLE_NOT_DEADLOCK_RAG;
    const singleDet = detectSingleInstance(graph);
    // In multi-instance graph, hasCycle is true, but isDeadlock must be false (necessary but not sufficient)
    const passed = singleDet.hasCycle && !singleDet.isDeadlock;

    results.push({
      id: 'EXTRA_2',
      name: 'Extra: Cycle But No Deadlock (Multi-Instance RAG)',
      condition: 'R1 & R2 have 2 instances each; cycle between P1 and P2, but P3 and P4 hold instances without waiting',
      expectedResult: 'Cycle detected, but labeled: Cycle is NOT proof of deadlock in multi-instance systems',
      actualResult: `hasCycle=${singleDet.hasCycle}, isDeadlock=${singleDet.isDeadlock}`,
      passed,
      category: 'EXTRA',
      analysis: 'P3 and P4 hold resources but do not request anything. Once P3 and P4 finish, their instances return to the pool, breaking the cycle and allowing P1 and P2 to complete.',
    });
  }

  // -------------------------------------------------------------------------
  // Extra 3: Victim Termination Recovery
  // -------------------------------------------------------------------------
  {
    const state = PRESET_TEXTBOOK_DEADLOCK;
    // Terminate victim P2 which holds [3, 0, 3]
    const recovery = terminateProcess(state, 2);
    // After P2 is terminated, run detection on newState
    const detAfter = detectMultiInstance(
      recovery.newState.available,
      recovery.newState.allocation,
      recovery.newState.requests!,
      recovery.newState.processes
    );
    // After releasing P2's [3,0,3], Work becomes [3,0,3], satisfying P1's [2,0,2] and P3's [1,0,0], resolving deadlock!
    const passed = !detAfter.deadlocked && recovery.releasedResources[0] === 3;

    results.push({
      id: 'EXTRA_3',
      name: 'Extra: Deadlock Recovery via Victim Termination',
      condition: 'Terminate P2 from textbook deadlocked state, releasing [3, 0, 3] to Available',
      expectedResult: 'Deadlock completely resolved; remaining processes {P0, P1, P3, P4} successfully finish',
      actualResult: `Released=[${recovery.releasedResources.join(', ')}], Deadlocked After=${detAfter.deadlocked}`,
      passed,
      category: 'EXTRA',
      analysis: 'Terminating P2 reclaims 3 units of Resource A and 3 of Resource C. Available increases to [3, 1, 3], satisfying P1 and P3, successfully breaking the deadlock cycle.',
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Vitest Test Suite Execution
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';

describe('DeadlockLab Algorithmic Engine (TC1 to TC6 + Extras)', () => {
  const suiteResults = runEngineTestSuite();

  suiteResults.forEach(tc => {
    it(`[${tc.id}] ${tc.name}`, () => {
      expect(tc.passed).toBe(true);
    });
  });
});
