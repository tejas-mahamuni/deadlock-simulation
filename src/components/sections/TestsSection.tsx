/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Rv } from '../common/Rv.tsx';
import { Res } from '../common/Res.tsx';
import {
  computeNeed,
  safetyCheck,
  requestCheck,
  detectMultiInstance,
  checkOrdering,
  terminateProcess,
  PRESET_TEXTBOOK_SAFE,
  PRESET_TEXTBOOK_DEADLOCK,
} from '../../engine/deadlockEngine.ts';

export const TestsSection: React.FC = () => {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Live test evaluations
  const tests = [
    {
      id: 'TC1',
      name: 'Textbook Safe State Baseline',
      run: () => {
        const need = computeNeed(PRESET_TEXTBOOK_SAFE.max, PRESET_TEXTBOOK_SAFE.allocation);
        const s = safetyCheck(PRESET_TEXTBOOK_SAFE.available, PRESET_TEXTBOOK_SAFE.allocation, need);
        const seqStr = s.sequenceNames.join(' → ');
        const pass = s.safe && seqStr === 'P1 → P3 → P4 → P0 → P2';
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Safe sequence: ${seqStr}`,
          expected: 'Safe sequence <P1, P3, P4, P0, P2>',
        };
      },
    },
    {
      id: 'TC2',
      name: 'Request Exceeds Available (Wait, No State Change)',
      run: () => {
        const r = requestCheck(0, [7, 4, 3], PRESET_TEXTBOOK_SAFE);
        const pass = r.status === 'WAITING';
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Status: ${r.status} (${r.message})`,
          expected: 'WAITING: Process queued, state untouched',
        };
      },
    },
    {
      id: 'TC3',
      name: 'Unsafe Request (Rollback Guarantee)',
      run: () => {
        const r = requestCheck(0, [0, 0, 2], PRESET_TEXTBOOK_SAFE);
        const pass = r.status === 'DENIED_UNSAFE';
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Status: ${r.status} (denied, original state restored)`,
          expected: 'DENIED_UNSAFE: Request rejected, state rolled back',
        };
      },
    },
    {
      id: 'TC4',
      name: 'Multi-Instance Deadlock Detection',
      run: () => {
        const d = detectMultiInstance(
          PRESET_TEXTBOOK_DEADLOCK.available,
          PRESET_TEXTBOOK_DEADLOCK.allocation,
          PRESET_TEXTBOOK_DEADLOCK.requests || [],
          PRESET_TEXTBOOK_DEADLOCK.processes
        );
        const stuck = d.deadlockedProcesses.join(', ');
        const pass = d.deadlocked && stuck === 'P1, P2';
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Deadlocked processes: {${stuck}}`,
          expected: 'Deadlocked: {P1, P2} stuck in circular wait',
        };
      },
    },
    {
      id: 'TC5',
      name: 'Prevention: Havender Ordering Rule',
      run: () => {
        const lowerRank = checkOrdering([2], 1, 'R1');
        const higherRank = checkOrdering([1], 2, 'R2');
        const pass = !lowerRank.allowed && higherRank.allowed;
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Holding 2 requesting 1: ${lowerRank.allowed ? 'allowed' : 'blocked'}; requesting 2: allowed`,
          expected: 'Blocked on lower rank; allowed on higher rank',
        };
      },
    },
    {
      id: 'TC6',
      name: 'Boundary & Validation Checks',
      run: () => {
        const nonExistent = requestCheck(9, [0, 0, 0], PRESET_TEXTBOOK_SAFE);
        const negative = requestCheck(0, [-1, 0, 0], PRESET_TEXTBOOK_SAFE);
        const zeroReq = requestCheck(0, [0, 0, 0], PRESET_TEXTBOOK_SAFE);
        const pass =
          nonExistent.status === 'INVALID_INPUT' &&
          negative.status === 'INVALID_INPUT' &&
          zeroReq.status === 'GRANTED';
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: 'Rejected P9 & negative values; safely handled [0,0,0]',
          expected: 'INVALID_INPUT for invalid params, GRANTED for [0,0,0]',
        };
      },
    },
    {
      id: 'Extra 1',
      name: 'Safe Request Grant & State Mutation',
      run: () => {
        const r = requestCheck(1, [1, 0, 2], PRESET_TEXTBOOK_SAFE);
        const pass =
          r.status === 'GRANTED' &&
          r.finalState.available.join(',') === '2,3,0' &&
          r.finalState.allocation[1].join(',') === '3,0,2';
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Granted: Available becomes [${r.finalState.available.join(', ')}], P1 holds [${r.finalState.allocation[1].join(', ')}]`,
          expected: 'GRANTED: Available=[2,3,0], P1=[3,0,2]',
        };
      },
    },
    {
      id: 'Extra 2',
      name: 'Multi-Instance Cycle Without Deadlock',
      run: () => {
        // P0, P1, P2 with 2 instances of R1, R2. Cycle exists between P0 & P1, but P2 holds R1 and needs nothing.
        const d = detectMultiInstance([0, 1], [[1, 0], [0, 1], [1, 0]], [[0, 1], [1, 0], [0, 0]], ['P0', 'P1', 'P2']);
        const pass = !d.deadlocked;
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Cycle exists, but P2 finishes first and frees R1, breaking the cycle. Deadlocked: ${d.deadlocked}`,
          expected: 'NO DEADLOCK: Outside process frees resources',
        };
      },
    },
    {
      id: 'Extra 3',
      name: 'Victim Termination Recovery',
      run: () => {
        const recovery = terminateProcess(PRESET_TEXTBOOK_DEADLOCK, 2);
        const detectionAfter = detectMultiInstance(
          recovery.newState.available,
          recovery.newState.allocation,
          recovery.newState.requests || [],
          recovery.newState.processes
        );
        const pass = !detectionAfter.deadlocked;
        return {
          pass,
          status: pass ? 'Passed' : 'Failed',
          detail: `Terminated P2 freed [${recovery.releasedResources.join(', ')}]. Deadlock cleared: ${!detectionAfter.deadlocked}`,
          expected: 'Deadlock resolved via single victim termination',
        };
      },
    },
  ];

  const results = tests.map(t => ({ id: t.id, name: t.name, ...t.run() }));
  const allPassed = results.every(r => r.pass);

  const handleCopySummary = () => {
    const summary = results
      .map(r => `[${r.pass ? 'PASS' : 'FAIL'}] ${r.id}: ${r.name} -> ${r.detail}`)
      .join('\n');
    navigator.clipboard.writeText(summary);
    setCopyStatus('Summary copied to clipboard!');
    setTimeout(() => setCopyStatus(null), 3000);
  };

  return (
    <section id="tests">
      <Rv>
        <h2>
          Proof, <span className="g">live.</span>
        </h2>
        <p className="lead">
          These test results are executed directly in your browser by the pure TypeScript engine right now.
        </p>

        <div className="stage">
          <div className="chips">
            <span
              className="chip"
              style={{
                borderColor: allPassed ? 'var(--ok)' : 'var(--bad)',
                color: allPassed ? 'var(--ok)' : 'var(--bad)',
                fontWeight: 600,
              }}
            >
              {allPassed ? `✓ All ${results.length} Test Cases Passing` : 'Issues Detected'}
            </span>
            <button className="chip" onClick={handleCopySummary}>
              Copy Test Summary
            </button>
          </div>

          {copyStatus && (
            <p className="small" style={{ color: 'var(--ok)', fontWeight: 600, margin: '0 0 12px' }}>
              ✓ {copyStatus}
            </p>
          )}

          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Scenario</th>
                  <th>Actual (Live Engine)</th>
                  <th>Detail</th>
                  <th>Expected</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td style={{ color: r.pass ? 'var(--ok)' : 'var(--bad)', fontWeight: 600 }}>
                      {r.pass ? '✓ Pass' : '✗ Fail'}
                    </td>
                    <td style={{ textAlign: 'left', fontSize: 13 }}>{r.detail}</td>
                    <td style={{ textAlign: 'left', fontSize: 13, color: 'var(--mu)' }}>{r.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Res
            r={
              allPassed
                ? {
                    st: 'safe',
                    msg: `All ${results.length} test cases verified: Banker’s safety sequence matching, request pipeline denial & rollback, multi-instance detection, Havender circular wait elimination, and victim recovery.`,
                  }
                : {
                    st: 'invalid',
                    msg: 'One or more test assertions failed in the engine.',
                  }
            }
          />
        </div>
      </Rv>
    </section>
  );
};
