/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Rv } from '../common/Rv.tsx';
import { Res } from '../common/Res.tsx';
import { checkOrdering } from '../../engine/deadlockEngine.ts';

export const PreventSection: React.FC = () => {
  const [heldRank, setHeldRank] = useState<number>(2);
  const [askRank, setAskRank] = useState<number>(1);
  const [activeStrategy, setActiveStrategy] = useState<string>('ordering');

  const orderingCheck = checkOrdering([heldRank], askRank, `R${askRank}`);

  return (
    <section id="prevent">
      <Rv>
        <h2>
          Or design it <span className="g">away.</span>
        </h2>
        <p className="lead">
          Why detect or avoid deadlock when you can structure the system so deadlock is mathematically impossible? Break one of the four conditions by design.
        </p>

        {/* Havender's Rule Simulator */}
        <div className="stage">
          <h3 style={{ marginBottom: 8 }}>Havender’s Ordering Rule (Circular Wait Elimination)</h3>
          <p className="small" style={{ margin: '0 0 16px' }}>
            Rule: Every resource type is assigned a unique positive rank. A process may only request a resource ranked strictly higher than any resource it currently holds: Rank(Requested) &gt; Max(Rank(Held)).
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
            <span>Currently holding resource with Rank</span>
            <input
              type="number"
              min="1"
              value={heldRank}
              onChange={e => setHeldRank(Math.max(1, parseInt(e.target.value, 10) || 1))}
              aria-label="Held rank"
            />
            <span>asking for resource with Rank</span>
            <input
              type="number"
              min="1"
              value={askRank}
              onChange={e => setAskRank(Math.max(1, parseInt(e.target.value, 10) || 1))}
              aria-label="Requested rank"
            />
          </div>

          <Res
            r={
              orderingCheck.allowed
                ? {
                    st: 'safe',
                    msg: `Allowed: Rank ${askRank} > Rank ${heldRank}. Strict ascending order guarantees that resource dependencies cannot loop back into a cycle.`,
                  }
                : {
                    st: 'waiting',
                    msg: `Blocked: Rank ${askRank} ≤ Rank ${heldRank}. To request Rank ${askRank}, the process must release Rank ${heldRank} first. This breaks circular wait by design.`,
                  }
            }
          />
        </div>

        {/* 3 Core Strategies */}
        <div className="stage" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Three Architectural Prevention Strategies</h3>
          <p className="small" style={{ margin: '0 0 18px' }}>
            Compare how different operating systems trade hardware concurrency for safety:
          </p>

          <div className="chips">
            <button
              className={`chip ${activeStrategy === 'ordering' ? 'a' : ''}`}
              onClick={() => setActiveStrategy('ordering')}
            >
              1. Resource Ordering (Circular Wait)
            </button>
            <button
              className={`chip ${activeStrategy === 'all-at-once' ? 'a' : ''}`}
              onClick={() => setActiveStrategy('all-at-once')}
            >
              2. Conservative All-at-Once (Hold & Wait)
            </button>
            <button
              className={`chip ${activeStrategy === 'preemption' ? 'a' : ''}`}
              onClick={() => setActiveStrategy('preemption')}
            >
              3. Forced Preemption (No Preemption)
            </button>
          </div>

          <div className="grid" style={{ marginTop: 14 }}>
            <div
              className="card"
              style={{
                background: activeStrategy === 'ordering' ? 'var(--bg)' : 'var(--bg2)',
                border: activeStrategy === 'ordering' ? '1.5px solid var(--tx)' : '1px solid var(--ln)',
              }}
            >
              <h3>Resource Ordering</h3>
              <p>
                <strong>Condition Broken:</strong> Circular Wait.<br />
                <strong>Mechanism:</strong> Global total order function f: R → ℕ. Processes acquire resources in strictly increasing rank.<br />
                <strong>Trade-off:</strong> High device concurrency, but programmers must adhere to fixed acquisition sequences.
              </p>
            </div>

            <div
              className="card"
              style={{
                background: activeStrategy === 'all-at-once' ? 'var(--bg)' : 'var(--bg2)',
                border: activeStrategy === 'all-at-once' ? '1.5px solid var(--tx)' : '1px solid var(--ln)',
              }}
            >
              <h3>Request Everything First</h3>
              <p>
                <strong>Condition Broken:</strong> Hold and Wait.<br />
                <strong>Mechanism:</strong> A process must request and receive all required resources before execution begins, or release all held items before requesting more.<br />
                <strong>Trade-off:</strong> Zero circular wait risk, but severe resource underutilization (e.g. printer held for 2 hours before being touched).
              </p>
            </div>

            <div
              className="card"
              style={{
                background: activeStrategy === 'preemption' ? 'var(--bg)' : 'var(--bg2)',
                border: activeStrategy === 'preemption' ? '1.5px solid var(--tx)' : '1px solid var(--ln)',
              }}
            >
              <h3>Forced Preemption</h3>
              <p>
                <strong>Condition Broken:</strong> No Preemption.<br />
                <strong>Mechanism:</strong> When a process requests an unavailable resource, the kernel forcibly steals its currently held resources and puts it to sleep.<br />
                <strong>Trade-off:</strong> Ideal for CPU registers and memory pages; impractical for physical hardware like tape drives or GPU streaming state without checkpointing.
              </p>
            </div>
          </div>
        </div>
      </Rv>
    </section>
  );
};
