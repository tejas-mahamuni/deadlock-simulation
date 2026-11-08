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
  PRESET_TEXTBOOK_SAFE,
  RequestResult,
} from '../../engine/deadlockEngine.ts';

const P = (i: number) => `P${i}`;
const resName = (j: number) => String.fromCharCode(65 + j);

export const BankerSection: React.FC = () => {
  const [al, setAl] = useState<number[][]>(() => PRESET_TEXTBOOK_SAFE.allocation.map(r => [...r]));
  const [mx, setMx] = useState<number[][]>(() => PRESET_TEXTBOOK_SAFE.max.map(r => [...r]));
  const [av, setAv] = useState<number[]>(() => [...PRESET_TEXTBOOK_SAFE.available]);

  const [pi, setPi] = useState<number>(1);
  const [rq, setRq] = useState<number[]>([1, 0, 2]);
  const [reqResult, setReqResult] = useState<RequestResult | null>(null);

  // Stepper state for safety sequence
  const [stepMode, setStepMode] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const numResources = av.length;
  const resourceNames = Array.from({ length: numResources }, (_, j) => resName(j));
  const processNames = al.map((_, i) => P(i));

  const nd = computeNeed(mx, al);
  const s = safetyCheck(av, al, nd, processNames);

  const upd = (setFn: React.Dispatch<React.SetStateAction<number[][]>>, m: number[][], i: number, j: number, v: number) => {
    const c = m.map(r => [...r]);
    c[i][j] = Math.max(0, v);
    setFn(c);
    setReqResult(null);
  };

  const addProcess = () => {
    if (al.length >= 8) return;
    setAl(prev => [...prev, new Array(numResources).fill(0)]);
    setMx(prev => [...prev, new Array(numResources).fill(0)]);
    setReqResult(null);
  };

  const removeProcess = () => {
    if (al.length <= 2) return;
    setAl(prev => prev.slice(0, -1));
    setMx(prev => prev.slice(0, -1));
    if (pi >= al.length - 1) setPi(0);
    setReqResult(null);
  };

  const addResource = () => {
    if (numResources >= 6) return;
    setAl(prev => prev.map(row => [...row, 0]));
    setMx(prev => prev.map(row => [...row, 0]));
    setAv(prev => [...prev, 2]);
    setRq(prev => [...prev, 0]);
    setReqResult(null);
  };

  const removeResource = () => {
    if (numResources <= 1) return;
    setAl(prev => prev.map(row => row.slice(0, -1)));
    setMx(prev => prev.map(row => row.slice(0, -1)));
    setAv(prev => prev.slice(0, -1));
    setRq(prev => prev.slice(0, -1));
    setReqResult(null);
  };

  const loadScenario = (procIdx: number, reqVec: number[]) => {
    const baseAl = PRESET_TEXTBOOK_SAFE.allocation.map(r => [...r]);
    const baseMx = PRESET_TEXTBOOK_SAFE.max.map(r => [...r]);
    const baseAv = [...PRESET_TEXTBOOK_SAFE.available];
    setAl(baseAl);
    setMx(baseMx);
    setAv(baseAv);
    setPi(procIdx);
    setRq([...reqVec]);
    const r = requestCheck(procIdx, reqVec, {
      processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
      resources: ['A', 'B', 'C'],
      allocation: baseAl,
      max: baseMx,
      available: baseAv,
    });
    setReqResult(r);
  };

  const handleCheck = () => {
    const r = requestCheck(pi, rq, {
      processes: processNames,
      resources: resourceNames,
      allocation: al,
      max: mx,
      available: av,
    });
    setReqResult(r);
    if (r.status === 'GRANTED') {
      setAl(r.finalState.allocation);
      setAv(r.finalState.available);
    }
  };

  const hasNegativeNeed = nd.some(row => row.some(v => v < 0));

  return (
    <section id="bankers">
      <Rv>
        <h2>
          Avoid it with the <span className="g">Banker’s Algorithm.</span>
        </h2>
        <p className="lead">
          Before granting a request, pretend to grant it. If everyone can still finish, say yes. Otherwise say no. Edit any number, configure processes/resources, and watch the multi-stage pipeline.
        </p>

        <div className="stage">
          {/* Dimension Controls & Preset chips */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Configure Dimensions:</span>
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span className="small">Processes ({al.length}):</span>
              <button className="chip" style={{ padding: '4px 10px', fontSize: 13 }} onClick={addProcess} disabled={al.length >= 8} title="Add process">
                + Process
              </button>
              <button className="chip" style={{ padding: '4px 10px', fontSize: 13 }} onClick={removeProcess} disabled={al.length <= 2} title="Remove process">
                − Process
              </button>
            </div>

            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span className="small">Resources ({numResources}):</span>
              <button className="chip" style={{ padding: '4px 10px', fontSize: 13 }} onClick={addResource} disabled={numResources >= 6} title="Add resource type">
                + Resource
              </button>
              <button className="chip" style={{ padding: '4px 10px', fontSize: 13 }} onClick={removeResource} disabled={numResources <= 1} title="Remove resource type">
                − Resource
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="chips">
            <button className="chip" onClick={() => loadScenario(1, [1, 0, 2])}>
              Scenario A: Safe (P1: [1, 0, 2])
            </button>
            <button className="chip" onClick={() => loadScenario(0, [7, 4, 3])}>
              Scenario B: Exceeds Avail (P0: [7, 4, 3])
            </button>
            <button className="chip" onClick={() => loadScenario(0, [0, 0, 2])}>
              Scenario C: Unsafe/Denied (P0: [0, 0, 2])
            </button>
            <button className="chip" onClick={() => loadScenario(0, [8, 0, 0])}>
              Scenario F: Invalid Claim (P0: [8, 0, 0])
            </button>
            <button
              className="chip"
              onClick={() => {
                setAl(PRESET_TEXTBOOK_SAFE.allocation.map(r => [...r]));
                setMx(PRESET_TEXTBOOK_SAFE.max.map(r => [...r]));
                setAv([...PRESET_TEXTBOOK_SAFE.available]);
                setRq([1, 0, 2]);
                setPi(1);
                setReqResult(null);
                setStepMode(false);
                setCurrentStepIndex(0);
              }}
            >
              Reset Baseline
            </button>
          </div>

          {/* Matrices Table */}
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Process</th>
                  <th colSpan={numResources}>Holds (Allocation)</th>
                  <th colSpan={numResources}>Can ever want (Max)</th>
                  <th colSpan={numResources}>Still needs</th>
                </tr>
                <tr>
                  <th></th>
                  {resourceNames.map(r => <th key={`al-${r}`} style={{ fontSize: 12 }}>{r}</th>)}
                  {resourceNames.map(r => <th key={`mx-${r}`} style={{ fontSize: 12 }}>{r}</th>)}
                  {resourceNames.map(r => <th key={`nd-${r}`} style={{ fontSize: 12 }}>{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {al.map((r, i) => (
                  <tr key={i}>
                    <td>{P(i)}</td>
                    {r.map((v, j) => (
                      <td key={j}>
                        <input
                          type="number"
                          min="0"
                          value={v}
                          aria-label={`P${i} Allocation ${resName(j)}`}
                          onChange={e =>
                            upd(setAl, al, i, j, e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                          }
                        />
                      </td>
                    ))}
                    {mx[i].map((v, j) => (
                      <td key={j}>
                        <input
                          type="number"
                          min="0"
                          value={v}
                          aria-label={`P${i} Max ${resName(j)}`}
                          onChange={e =>
                            upd(setMx, mx, i, j, e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                          }
                        />
                      </td>
                    ))}
                    {nd[i].map((v, j) => (
                      <td key={j} style={{ color: v < 0 ? 'var(--bad)' : 'var(--tx)', fontWeight: 600 }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>Free (Available)</td>
                  {av.map((v, j) => (
                    <td key={j}>
                      <input
                        type="number"
                        min="0"
                        value={v}
                        aria-label={`Available ${resName(j)}`}
                        onChange={e => {
                          const c = [...av];
                          c[j] = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setAv(c);
                          setReqResult(null);
                        }}
                      />
                    </td>
                  ))}
                  <td colSpan={numResources * 2} className="small" style={{ textAlign: 'left' }}>
                    Columns are resources {resourceNames.join(', ')}. Still needs = Max − Holds.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {hasNegativeNeed ? (
            <Res
              r={{
                st: 'invalid',
                msg: 'A process holds more than its maximum demand. Fix the table so Holds ≤ Max.',
              }}
            />
          ) : (
            <>
              {/* Safety Sequence Section with Interactive Stepper */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 28, marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Is this state safe?</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`chip ${!stepMode ? 'a' : ''}`}
                    style={{ padding: '5px 12px', fontSize: 13 }}
                    onClick={() => setStepMode(false)}
                  >
                    View Full Table
                  </button>
                  <button
                    className={`chip ${stepMode ? 'a' : ''}`}
                    style={{ padding: '5px 12px', fontSize: 13 }}
                    onClick={() => {
                      setStepMode(true);
                      setCurrentStepIndex(0);
                    }}
                  >
                    Interactive Stepper
                  </button>
                </div>
              </div>

              <p className="small" style={{ margin: '0 0 10px' }}>
                Work starts as the free pool [{av.join(', ')}]. Any process whose need fits in Work can finish and return its resources.
              </p>

              {stepMode && s.steps.length > 0 ? (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--ln)', borderRadius: 16, padding: 20, margin: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#0071e3' }}>
                      Step {currentStepIndex + 1} of {s.steps.length}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn s"
                        style={{ padding: '6px 14px', fontSize: 13 }}
                        disabled={currentStepIndex <= 0}
                        onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                      >
                        ← Previous
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '6px 14px', fontSize: 13 }}
                        disabled={currentStepIndex >= s.steps.length - 1}
                        onClick={() => setCurrentStepIndex(prev => Math.min(s.steps.length - 1, prev + 1))}
                      >
                        Next Step →
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const step = s.steps[currentStepIndex];
                    if (!step) return null;
                    return (
                      <div>
                        <p style={{ margin: '0 0 8px', fontSize: 15 }}>
                          Checking <strong>{step.processName}</strong>: Need [{step.need.join(', ')}] ≤ Work [{step.workBefore.join(', ')}]
                        </p>
                        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--ok)', fontWeight: 600 }}>
                          ✓ Condition satisfied! {step.processName} can finish and release its allocation [{step.allocation.join(', ')}].
                        </p>
                        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, background: 'var(--bg2)', padding: '8px 12px', borderRadius: 8 }}>
                          New Work = [{step.workBefore.join(', ')}] + [{step.allocation.join(', ')}] = [{step.workAfter.join(', ')}]
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Finishes</th>
                        <th>Work before</th>
                        <th>Held (Released)</th>
                        <th>Work after</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.steps.map((t, k) => (
                        <tr key={k}>
                          <td>{k + 1}</td>
                          <td style={{ fontWeight: 600 }}>{t.processName}</td>
                          <td>[{t.workBefore.join(', ')}]</td>
                          <td style={{ color: 'var(--ok)' }}>+ [{t.allocation.join(', ')}]</td>
                          <td style={{ fontWeight: 600 }}>[{t.workAfter.join(', ')}]</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Res
                r={
                  s.safe
                    ? {
                        st: 'safe',
                        msg: `Safe sequence: ${s.sequenceNames.join(' → ')}. All processes can finish under peak demand.`,
                      }
                    : {
                        st: 'unsafe',
                        msg: `No complete safe sequence found. Stuck processes: ${al
                          .map((_, i) => i)
                          .filter(i => !s.sequence.includes(i))
                          .map(P)
                          .join(', ')}. Crucial principle: Unsafe means deadlock is possible, not that it has happened.`,
                      }
                }
              />
            </>
          )}

          {/* Ask for resources tester */}
          <h3 style={{ marginTop: 32 }}>Ask for resources (4-Stage Pipeline)</h3>
          <p className="small" style={{ margin: '0 0 12px' }}>
            Submit a vector request. The kernel evaluates syntax, maximum claim, resource availability, and safety simulation.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              margin: '12px 0 16px',
            }}
          >
            <select
              aria-label="Process"
              value={pi}
              onChange={e => {
                setPi(+e.target.value);
                setReqResult(null);
              }}
            >
              {al.map((_, i) => (
                <option key={i} value={i}>
                  {P(i)}
                </option>
              ))}
              <option value={99}>P99 (Invalid/Non-existent)</option>
            </select>

            <span>requests</span>

            {rq.map((v, j) => (
              <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {resName(j)}
                <input
                  type="number"
                  min="0"
                  value={v}
                  aria-label={`Request ${resName(j)}`}
                  onChange={e => {
                    const c = [...rq];
                    c[j] = parseInt(e.target.value, 10) || 0;
                    setRq(c);
                    setReqResult(null);
                  }}
                />
              </span>
            ))}

            <button className="btn" onClick={handleCheck}>
              Check request
            </button>
          </div>

          {/* 4-Stage Request Pipeline Result Display */}
          {reqResult && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--mu)' }}>
                4-Stage Kernel Evaluation Pipeline
              </h4>
              <div className="grid" style={{ marginBottom: 14 }}>
                {reqResult.stages.map((stg, sIdx) => {
                  const isPass = stg.statusLabel === 'PASSED';
                  const isWait = stg.statusLabel === 'WAITING';
                  const isFail = stg.statusLabel === 'FAILED' || stg.statusLabel === 'DENIED';
                  const color = isPass ? 'var(--ok)' : isWait ? 'var(--wa)' : 'var(--bad)';

                  return (
                    <div
                      key={sIdx}
                      className="card"
                      style={{
                        background: 'var(--bg)',
                        border: `1.5px solid ${color}`,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)' }}>
                            STAGE {stg.stageNumber}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color,
                              border: `1px solid ${color}`,
                              padding: '2px 6px',
                              borderRadius: 6,
                            }}
                          >
                            {stg.statusLabel}
                          </span>
                        </div>
                        <h4 style={{ fontSize: 14, margin: '4px 0 6px' }}>{stg.title}</h4>
                        <p style={{ fontSize: 12, color: 'var(--mu)', margin: 0, lineHeight: 1.4 }}>
                          {stg.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {reqResult.rolledBack && (
                <p className="small" style={{ color: 'var(--wa)', fontWeight: 600, margin: '4px 0 10px' }}>
                  ↺ State Rollback Activated: Allocation was simulated tentatively and safely rolled back to the original baseline.
                </p>
              )}

              <Res
                r={{
                  st:
                    reqResult.status === 'GRANTED'
                      ? 'granted'
                      : reqResult.status === 'WAITING'
                      ? 'waiting'
                      : reqResult.status === 'INVALID_INPUT'
                      ? 'invalid'
                      : 'unsafe',
                  msg: reqResult.message,
                  details: reqResult.explanation,
                }}
              />
            </div>
          )}
        </div>
      </Rv>
    </section>
  );
};
