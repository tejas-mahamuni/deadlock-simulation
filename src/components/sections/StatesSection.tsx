/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Rv } from '../common/Rv.tsx';

export const StatesSection: React.FC = () => {
  return (
    <section id="states">
      <Rv>
        <h2>
          Safe, unsafe, <span className="g">deadlocked.</span>
        </h2>
        <p className="lead">
          These are not the same. Unsafe only means a stuck future is possible under peak demand.
        </p>

        <div className="stage">
          <div className="rings">
            {/* Unsafe outer ring */}
            <div
              style={{
                inset: 0,
                background: 'color-mix(in srgb, var(--bad) 14%, var(--bg))',
                color: 'var(--bad)',
                border: '1.5px dashed var(--bad)',
              }}
            >
              Unsafe State
            </div>

            {/* Deadlocked inner subset */}
            <div
              style={{
                inset: '26% 8% 8% 8%',
                background: 'color-mix(in srgb, var(--bad) 26%, var(--bg))',
                color: 'var(--bad)',
                border: '1.5px solid var(--bad)',
              }}
            >
              Deadlocked State
            </div>

            {/* Safe separate circle */}
            <div
              style={{
                inset: '12% 12% 62% 12%',
                background: 'color-mix(in srgb, var(--ok) 25%, var(--bg))',
                color: 'var(--ok)',
                borderRadius: '50%',
                border: '1.5px solid var(--ok)',
              }}
            >
              Safe State
            </div>
          </div>

          <p className="small" style={{ textAlign: 'center', marginTop: 24 }}>
            Deadlocked states are a strict subset of unsafe states. Safe states are completely disjoint.
          </p>

          <div className="grid" style={{ marginTop: 24 }}>
            <div className="card">
              <h3 style={{ color: 'var(--ok)' }}>Safe State</h3>
              <p>
                At least one execution sequence exists such that all processes can finish under their maximum declared demand.
              </p>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--wa)' }}>Unsafe State</h3>
              <p>
                No complete safe sequence is guaranteed under peak demand. Deadlock is possible, but NOT inevitable if processes release resources early.
              </p>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--bad)' }}>Deadlocked State</h3>
              <p>
                Processes are currently blocked in a circular dependency where no outstanding request can be satisfied. Zero progress is possible.
              </p>
            </div>
          </div>

          {/* Deep Conceptual Distinction: Avoidance vs Detection vs Prevention */}
          <h3 style={{ marginTop: 36, marginBottom: 8 }}>
            Core Distinction: Avoidance vs. Detection vs. Prevention
          </h3>
          <p className="small" style={{ margin: '0 0 16px' }}>
            A common viva mistake is confusing Banker&apos;s avoidance with deadlock detection. Here is the exact architectural comparison:
          </p>

          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>When It Executes</th>
                  <th>Information Required</th>
                  <th>Algorithm & Mechanism</th>
                  <th>Overhead & Trade-offs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: '#0071e3' }}>Avoidance (Banker&apos;s)</td>
                  <td>Proactive: Before granting any resource request</td>
                  <td>Current Allocation + Declared <em>Maximum Claims</em></td>
                  <td>
                    Hypothetically grants request and checks if remaining system has a <em>Safe Sequence</em>. Rolls back if unsafe.
                  </td>
                  <td>
                    O(m·n²) per request. Processes must know maximum demands in advance (rare in general OSs).
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: 'var(--wa)' }}>Detection</td>
                  <td>Reactive: Periodically or when throughput drops</td>
                  <td>Current Allocation + Actual <em>Pending Requests</em></td>
                  <td>
                    Matrix reduction (multi-instance) or cycle detection (single-instance RAG) to find currently stuck processes.
                  </td>
                  <td>
                    Zero request-time check overhead. Allows maximum concurrency, but requires costly <em>recovery</em> (terminating processes or rollback).
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: 'var(--ok)' }}>Prevention</td>
                  <td>Design-time: In the kernel lock/resource architecture</td>
                  <td>System-wide resource ordering function (e.g. Havender)</td>
                  <td>
                    Eliminates at least 1 of Coffman&apos;s 4 conditions (e.g., enforce strict ascending lock order to eliminate Circular Wait).
                  </td>
                  <td>
                    Zero runtime algorithm overhead, but restricts programmer flexibility and can lower resource utilization.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Rv>
    </section>
  );
};
