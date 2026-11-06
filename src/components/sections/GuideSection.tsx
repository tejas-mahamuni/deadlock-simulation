/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Rv } from '../common/Rv.tsx';

interface WalkthroughStep {
  minute: number;
  title: string;
  keyIdea: string;
  talkingPoints: string[];
}

export const GuideSection: React.FC = () => {
  const [currentMin, setCurrentMin] = useState<number>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(360);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds]);

  const steps: WalkthroughStep[] = [
    {
      minute: 1,
      title: 'The Trap: How Programs Freeze',
      keyIdea: 'Deadlock is a circular wait condition where two or more processes each hold a resource that the other needs.',
      talkingPoints: [
        'Imagine P1 holds a Printer and requests a Scanner.',
        'Simultaneously, P2 holds the Scanner and requests the Printer.',
        'Neither process can make forward progress, release its held item, or receive the requested item.',
        'Without external intervention, the processes remain permanently suspended.',
      ],
    },
    {
      minute: 2,
      title: 'The Four Necessary Coffman Conditions',
      keyIdea: 'All four conditions must hold simultaneously for a deadlock to exist.',
      talkingPoints: [
        'Mutual Exclusion: Resources cannot be shared simultaneously.',
        'Hold and Wait: A process holding resources can request additional ones.',
        'No Preemption: Resources cannot be confiscated by force; only released voluntarily.',
        'Circular Wait: A closed loop {P0 → P1 → ... → P0} where each waits for the next.',
        'Engineering insight: Eliminating any single condition prevents deadlock entirely.',
      ],
    },
    {
      minute: 3,
      title: 'Avoidance: The Banker’s Algorithm',
      keyIdea: 'Never enter an unsafe state. Run a hypothetical safety simulation before granting any request.',
      talkingPoints: [
        'Processes declare their maximum claim upfront upon arrival.',
        'When a request arrives, check: Request ≤ Need, and Request ≤ Available.',
        'Pretend to grant the request, then run the Safety Algorithm.',
        'Safety Algorithm: Iteratively finds processes whose remaining Need ≤ Work (free pool).',
        'If a full safe sequence exists, grant the request. Otherwise, deny and roll back.',
      ],
    },
    {
      minute: 4,
      title: 'Detection & Victim Recovery',
      keyIdea: 'Let the system run without safety gates, then periodically audit the state matrix for stuck loops.',
      talkingPoints: [
        'Avoidance requires knowing maximum demand ahead of time, which many systems cannot predict.',
        'Detection algorithm: Matrix reduction using current actual requests.',
        'If stuck processes are found, the kernel must execute recovery.',
        'Recovery strategies: Terminate a victim process to reclaim its allocation, or roll back to a prior checkpoint.',
      ],
    },
    {
      minute: 5,
      title: 'Prevention: Havender’s Ordering Rule',
      keyIdea: 'Structure resource acquisition rules so circular wait is mathematically impossible.',
      talkingPoints: [
        'Assign each resource type a unique natural number rank: f: R → ℕ.',
        'Rule: A process holding resource Ri can only request Rj if f(Rj) > f(Ri).',
        'Proof by contradiction: If a circular wait loop existed, we would have rank(R1) < rank(R2) < ... < rank(R1), which is impossible.',
        'Modern usage: Standard lock ordering in operating system kernels (e.g. Linux lockdep).',
      ],
    },
    {
      minute: 6,
      title: 'Key Engineering Takeaways & Summary',
      keyIdea: 'Prevention eliminates risk at compile/design time; Avoidance manages risk at runtime; Detection resolves risk post-mortem.',
      talkingPoints: [
        'Unsafe != Deadlocked: Unsafe simply means peak demand could cause a freeze.',
        'Single-instance RAG cycles guarantee deadlock; multi-instance cycles do not.',
        'Modern OS kernels (Linux, macOS, Windows) frequently use the Ostrich algorithm for general processes, but strict lock ordering for internal kernel locks.',
      ],
    },
  ];

  const currentStep = steps.find(s => s.minute === currentMin) || steps[0];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const defenseCards = [
    {
      q: 'Why is an unsafe state not always deadlocked?',
      a: 'An unsafe state means there is no guaranteed execution sequence if all processes simultaneously demand their declared maximum resources. However, in reality, processes often finish and release resources early without needing their full maximum, allowing the system to run without deadlocking.',
    },
    {
      q: 'Does a cycle in a Resource Allocation Graph always guarantee deadlock?',
      a: 'In a single-instance system, YES: a cycle is both necessary and sufficient for deadlock. In a multi-instance system, NO: a cycle is necessary but NOT sufficient. If outside processes hold instances of the involved resources and can complete, they will free instances and dissolve the cycle.',
    },
    {
      q: 'Why does Banker’s algorithm have O(m · n²) time complexity?',
      a: 'Given n processes and m resource types, the safety check makes up to n passes. In each pass, it examines up to n uncompleted processes and compares their m-element Need vector against the Work vector (O(m · n) per pass). Repeating this for n processes yields O(m · n²).',
    },
    {
      q: 'How does Havender’s ordering rule mathematically eliminate circular wait?',
      a: 'By assigning a global total order f: R → ℕ and requiring that Rank(Requested) > Max(Rank(Held)), any circular wait sequence P0 → P1 → ... → Pk → P0 would require f(R0) < f(R1) < ... < f(Rk) < f(R0). Since a number cannot be strictly less than itself, circular wait cannot form.',
    },
    {
      q: 'What are the trade-offs between Prevention, Avoidance, and Detection?',
      a: 'Prevention imposes restrictive rules (poor resource utilization, conservative). Avoidance dynamically checks safety (requires knowing max demand upfront, runtime overhead). Detection allows full concurrency and only intervenes when trouble occurs (costs lost work during termination or rollback).',
    },
  ];

  return (
    <section id="guide">
      <Rv>
        <h2>
          Walkthrough & <span className="g">Defense Guide.</span>
        </h2>
        <p className="lead">
          Master the concepts in 6 minutes, and prepare for any concurrency questions with these core engineering principles.
        </p>

        {/* 6-Minute Concept Walkthrough */}
        <div className="stage">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0 }}>6-Minute Concept Walkthrough</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 18,
                  fontWeight: 700,
                  background: 'var(--bg)',
                  padding: '6px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--ln)',
                }}
              >
                ⏱ {formatTimer(timerSeconds)}
              </span>
              <button
                className="chip"
                onClick={() => setIsRunning(!isRunning)}
                style={{
                  background: isRunning ? 'var(--wa)' : 'var(--tx)',
                  color: 'var(--bg)',
                  borderColor: 'transparent',
                }}
              >
                {isRunning ? 'Pause' : 'Start Timer'}
              </button>
              <button
                className="chip"
                onClick={() => {
                  setIsRunning(false);
                  setTimerSeconds(360);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Minute Chips */}
          <div className="chips">
            {steps.map(s => (
              <button
                key={s.minute}
                className={`chip ${currentMin === s.minute ? 'a' : ''}`}
                onClick={() => setCurrentMin(s.minute)}
              >
                Min {s.minute}: {s.title.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Step Detail Card */}
          <div
            className="card"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--ln)',
              padding: 24,
              marginTop: 12,
            }}
          >
            <h3 style={{ color: '#0071e3', fontSize: 20 }}>
              Minute {currentStep.minute}: {currentStep.title}
            </h3>
            <p style={{ fontWeight: 600, color: 'var(--tx)', margin: '8px 0 14px' }}>
              {currentStep.keyIdea}
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--mu)', fontSize: 15, lineHeight: 1.6 }}>
              {currentStep.talkingPoints.map((pt, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  {pt}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              {currentMin > 1 && (
                <button className="btn s" onClick={() => setCurrentMin(prev => prev - 1)}>
                  ← Min {currentMin - 1}
                </button>
              )}
              {currentMin < 6 && (
                <button className="btn" onClick={() => setCurrentMin(prev => prev + 1)}>
                  Next: Min {currentMin + 1} →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Concurrency Interview & Defense Cards */}
        <div className="stage" style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 12 }}>Top 5 Concurrency Defense Questions</h3>
          <p className="small" style={{ margin: '0 0 18px' }}>
            Concise, rigorous explanations for the most common deadlock questions:
          </p>

          <div className="grid">
            {defenseCards.map((card, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--ln)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <h3 style={{ fontSize: 16, color: 'var(--tx)' }}>
                  {idx + 1}. {card.q}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--mu)', lineHeight: 1.55 }}>{card.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Rv>
    </section>
  );
};
