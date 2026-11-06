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

export const BankerSection: React.FC = () => {
  const [al, setAl] = useState<number[][]>(() => PRESET_TEXTBOOK_SAFE.allocation.map(r => [...r]));
  const [mx, setMx] = useState<number[][]>(() => PRESET_TEXTBOOK_SAFE.max.map(r => [...r]));
  const [av, setAv] = useState<number[]>(() => [...PRESET_TEXTBOOK_SAFE.available]);

  const [pi, setPi] = useState<number>(1);
  const [rq, setRq] = useState<number[]>([1, 0, 2]);
  const [reqResult, setReqResult] = useState<RequestResult | null>(null);

  const nd = computeNeed(mx, al);
  const s = safetyCheck(av, al, nd);

  const upd = (setFn: React.Dispatch<React.SetStateAction<number[][]>>, m: number[][], i: number, j: number, v: number) => {
    const c = m.map(r => [...r]);
    c[i][j] = Math.max(0, v);
    setFn(c);
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
    setRq(reqVec);
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
      processes: al.map((_, i) => P(i)),
      resources: ['A', 'B', 'C'],
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
          Before granting a request, pretend to grant it. If everyone can still finish, say yes. Otherwise say no. Edit any number and watch.
        </p>

        <div className="stage">
          {/* Quick preset chips */}
          <div className="chips">
            <button className="chip" onClick={() => loadScenario(1, [1, 0, 2])}>
              Safe request (P1: [1, 0, 2])
            </button>
            <button className="chip" onClick={() => loadScenario(0, [7, 4, 3])}>
              Too big for now (P0: [7, 4, 3])
            </button>
            <button className="chip" onClick={() => loadScenario(0, [0, 0, 2])}>
              Risky request (P0: [0, 0, 2])
            </button>
            <button className="chip" onClick={() => loadScenario(0, [8, 0, 0])}>
              Invalid request (P0: [8, 0, 0])
            </button>
            <button
              className="chip"
              onClick={() => {
                setAl(PRESET_TEXTBOOK_SAFE.allocation.map(r => [...r]));
                setMx(PRESET_TEXTBOOK_SAFE.max.map(r => [...r]));
                setAv([...PRESET_TEXTBOOK_SAFE.available]);
                setReqResult(null);
              }}
            >
              Reset
            </button>
          </div>

          {/* Matrices Table */}
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Process</th>
                  <th colSpan={3}>Holds (Allocation)</th>
                  <th colSpan={3}>Can ever want (Max)</th>
                  <th colSpan={3}>Still needs</th>
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
                          aria-label={`P${i} Allocation ${'ABC'[j]}`}
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
                          aria-label={`P${i} Max ${'ABC'[j]}`}
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
                        aria-label={`Available ${'ABC'[j]}`}
                        onChange={e => {
                          const c = [...av];
                          c[j] = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          setAv(c);
                          setReqResult(null);
                        }}
                      />
                    </td>
                  ))}
                  <td colSpan={6} className="small" style={{ textAlign: 'left' }}>
                    Columns are resources A, B, C. Still needs = Max − Holds.
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
              <h3 style={{ marginTop: 28 }}>Is this state safe?</h3>
              <p className="small" style={{ margin: '0 0 10px' }}>
                Work starts as the free pool. Any process whose need fits in Work can finish and return its resources.
              </p>

              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Finishes</th>
                      <th>Work before</th>
                      <th>Work after</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.steps.map((t, k) => (
                      <tr key={k}>
                        <td>{k + 1}</td>
                        <td>{P(t.processIndex)}</td>
                        <td>[{t.workBefore.join(', ')}]</td>
                        <td>[{t.workAfter.join(', ')}]</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
              <option value={9}>P9 (does not exist)</option>
            </select>

            <span>requests</span>

            {rq.map((v, j) => (
              <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {'ABC'[j]}
                <input
                  type="number"
                  min="0"
                  value={v}
                  aria-label={`Request ${'ABC'[j]}`}
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

          {reqResult && (
            <div>
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
