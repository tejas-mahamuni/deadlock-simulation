/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Rv } from '../common/Rv.tsx';
import { Res } from '../common/Res.tsx';
import {
  detectMultiInstance,
  terminateProcess,
  cloneState,
  PRESET_TEXTBOOK_DEADLOCK,
  SystemState,
} from '../../engine/deadlockEngine.ts';

const P = (i: number) => `P${i}`;

export const DetectSection: React.FC = () => {
  const [deadlockVariant, setDeadlockVariant] = useState<boolean>(true);
  const [state, setState] = useState<SystemState>(() => cloneState(PRESET_TEXTBOOK_DEADLOCK));
  const [terminatedProcess, setTerminatedProcess] = useState<number | null>(null);

  // Request matrix based on variant
  const requestMatrix = (state.requests || PRESET_TEXTBOOK_DEADLOCK.requests || []).map((r: number[], i: number) => {
    if (i === 2 && !deadlockVariant) {
      return [0, 0, 0]; // P2 wants nothing more -> safe reduction
    }
    return [...r];
  });

  const detection = detectMultiInstance(
    state.available,
    state.allocation,
    requestMatrix,
    state.processes
  );

  const resetDetection = (isDead: boolean) => {
    setDeadlockVariant(isDead);
    setState(cloneState(PRESET_TEXTBOOK_DEADLOCK));
    setTerminatedProcess(null);
  };

  const handleTerminateVictim = (victimIdx: number) => {
    const recovery = terminateProcess(state, victimIdx);
    setState(recovery.newState);
    setTerminatedProcess(victimIdx);
  };

  return (
    <section id="detect">
      <Rv>
        <h2>
          Or let it happen, then <span className="g">detect it.</span>
        </h2>
        <p className="lead">
          Banker’s algorithm prevents trouble proactively. Detection finds trouble that already exists in a running system. They solve different engineering problems.
        </p>

        <div className="stage">
          {/* Preset Variant Chips */}
          <div className="chips">
            <button
              className={`chip ${deadlockVariant && terminatedProcess === null ? 'a' : ''}`}
              onClick={() => resetDetection(true)}
            >
              Preset: P2 wants 1 more C (Deadlock)
            </button>
            <button
              className={`chip ${!deadlockVariant && terminatedProcess === null ? 'a' : ''}`}
              onClick={() => resetDetection(false)}
            >
              Preset: P2 wants nothing more (Resolves)
            </button>
            {terminatedProcess !== null && (
              <button className="chip" onClick={() => resetDetection(deadlockVariant)}>
                Reset Recovered State
              </button>
            )}
          </div>

          <p className="small" style={{ margin: '0 0 12px' }}>
            Multiple-instance resource pool (A=7, B=2, C=6). Current free Available is [{state.available.join(', ')}].
          </p>

          {/* Matrix Reduction Table */}
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Holds (Allocation)</th>
                  <th>Waiting for (Request)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {state.allocation.map((a, i) => {
                  const isStuck = detection.deadlockedIndices.includes(i);
                  const isTerm = terminatedProcess === i;

                  return (
                    <tr key={i}>
                      <td>{P(i)}</td>
                      <td>[{a.join(', ')}]</td>
                      <td>[{requestMatrix[i]?.join(', ') || '0, 0, 0'}]</td>
                      <td style={{ color: isTerm ? 'var(--mu)' : isStuck ? 'var(--bad)' : 'var(--ok)', fontWeight: 600 }}>
                        {isTerm ? 'Terminated (Victim)' : isStuck ? 'Deadlocked (Stuck)' : 'Can Finish'}
                      </td>
                      <td>
                        {isStuck && !isTerm ? (
                          <button
                            className="chip"
                            style={{ padding: '4px 10px', fontSize: 12, borderColor: 'var(--bad)', color: 'var(--bad)' }}
                            onClick={() => handleTerminateVictim(i)}
                          >
                            Terminate {P(i)}
                          </button>
                        ) : (
                          <span className="small">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Algorithm reduction steps */}
          <h3 style={{ marginTop: 26 }}>Matrix Reduction Trace</h3>
          <p className="small" style={{ margin: '0 0 8px' }}>
            The detection algorithm simulates returning held resources for each process whose request fits into the free pool:
          </p>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Process</th>
                  <th>Work Before</th>
                  <th>Freed Allocation</th>
                  <th>Work After</th>
                </tr>
              </thead>
              <tbody>
                {detection.steps.map((step, k) => (
                  <tr key={k}>
                    <td>{step.stepNumber}</td>
                    <td>{step.processName}</td>
                    <td>[{step.workBefore.join(', ')}]</td>
                    <td>[{step.allocation.join(', ')}]</td>
                    <td>[{step.workAfter.join(', ')}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Result card */}
          {detection.deadlocked ? (
            <Res
              r={{
                st: 'deadlock',
                msg: `Deadlock confirmed! Processes {${detection.deadlockedProcesses.join(', ')}} wait in a cycle where nobody can release resources. Click "Terminate" next to any stuck process to abort it and recover.`,
              }}
            />
          ) : (
            <Res
              r={{
                st: 'safe',
                msg: `Zero deadlocks. Completion order: ${detection.steps.map(s => s.processName).join(' → ') || 'All finished'}. All processes can finish and return resources to the operating system.`,
              }}
            />
          )}
        </div>
      </Rv>
    </section>
  );
};
