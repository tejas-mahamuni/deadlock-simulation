/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Rv } from '../common/Rv.tsx';
import { Res } from '../common/Res.tsx';

export const StorySection: React.FC = () => {
  const [step, setStep] = useState<number>(0);

  // Steps:
  // 0: Ready
  // 1: P1 grabs Printer
  // 2: P2 grabs Scanner
  // 3: P1 wants Scanner (waiting)
  // 4: P2 wants Printer (deadlock!)
  const isDead = step === 4;

  const stepDescriptions = [
    'Two programs share a printer and a scanner. Both resources are free in the pool.',
    'P1 requests and is granted the Printer exclusively.',
    'P2 requests and is granted the Scanner exclusively.',
    'P1 asks for the Scanner, but P2 holds it. P1 waits while holding the Printer.',
    'P2 asks for the Printer, but P1 holds it. P2 waits while holding the Scanner. Neither can move, ever.',
  ];

  return (
    <section id="learn">
      <Rv>
        <h2>
          It starts with <span className="g">two programs.</span>
        </h2>
        <p className="lead">
          Computers share things: printers, files, memory. When programs hold one thing while waiting for another, they can freeze together.
        </p>

        <div className="stage">
          <div className="chips">
            <button className={`chip ${step === 0 ? 'a' : ''}`} onClick={() => setStep(0)}>
              0. Start
            </button>
            <button className={`chip ${step === 1 ? 'a' : ''}`} onClick={() => setStep(1)}>
              1. P1 takes Printer
            </button>
            <button className={`chip ${step === 2 ? 'a' : ''}`} onClick={() => setStep(2)}>
              2. P2 takes Scanner
            </button>
            <button className={`chip ${step === 3 ? 'a' : ''}`} onClick={() => setStep(3)}>
              3. P1 wants Scanner
            </button>
            <button className={`chip ${step === 4 ? 'a' : ''}`} onClick={() => setStep(4)}>
              4. Deadlock!
            </button>
          </div>

          <div className={`dl ${isDead ? 'dead' : ''}`} style={{ margin: '30px 0' }}>
            {/* P1 */}
            <div style={{ textAlign: 'center' }}>
              <div className="node" style={{ borderColor: isDead ? 'var(--bad)' : 'var(--tx)' }}>
                P1
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                {step >= 1 ? 'holds Printer' : 'idle'}
              </div>
              {step >= 3 && (
                <div className="small" style={{ color: isDead ? 'var(--bad)' : 'var(--wa)', fontWeight: 600 }}>
                  waits for Scanner
                </div>
              )}
            </div>

            {/* Resources Center */}
            <div style={{ textAlign: 'center' }}>
              <div className="box" style={{ borderColor: step >= 1 ? '#0071e3' : 'var(--ln)' }}>
                Printer
              </div>
              <div style={{ height: 20 }} />
              <div className="box" style={{ borderColor: step >= 2 ? '#7c3aed' : 'var(--ln)' }}>
                Scanner
              </div>
            </div>

            {/* P2 */}
            <div style={{ textAlign: 'center' }}>
              <div className="node" style={{ borderColor: isDead ? 'var(--bad)' : 'var(--tx)' }}>
                P2
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                {step >= 2 ? 'holds Scanner' : 'idle'}
              </div>
              {step >= 4 && (
                <div className="small" style={{ color: 'var(--bad)', fontWeight: 600 }}>
                  waits for Printer
                </div>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', margin: '24px 0 16px', fontSize: 16 }}>
            {stepDescriptions[step]}
          </p>

          <div style={{ textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center' }}>
            {step < 4 ? (
              <button className="btn" onClick={() => setStep(prev => prev + 1)}>
                Next: {step === 3 ? 'P2 asks for Printer' : step === 2 ? 'P1 asks for Scanner' : step === 1 ? 'P2 takes Scanner' : 'P1 takes Printer'}
              </button>
            ) : (
              <button className="btn" onClick={() => setStep(0)}>
                Start over
              </button>
            )}
            {step > 0 && (
              <button className="btn s" onClick={() => setStep(prev => prev - 1)}>
                Step back
              </button>
            )}
          </div>

          <Res
            r={
              isDead
                ? {
                    st: 'deadlock',
                    msg: 'Deadlock has formed. P1 waits for Scanner (held by P2); P2 waits for Printer (held by P1). Without operating system intervention, both programs remain frozen indefinitely.',
                  }
                : step === 3
                ? {
                    st: 'waiting',
                    msg: 'P1 is waiting for Scanner. While blocked, P1 retains exclusive possession of the Printer (Hold and Wait).',
                  }
                : {
                    st: 'safe',
                    msg: 'System is running normally. No circular dependencies exist.',
                  }
            }
          />
        </div>
      </Rv>
    </section>
  );
};
