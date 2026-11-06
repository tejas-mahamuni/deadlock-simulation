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
        </div>
      </Rv>
    </section>
  );
};
