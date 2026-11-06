/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Rv } from '../common/Rv.tsx';
import { Res } from '../common/Res.tsx';

export const ConditionsSection: React.FC = () => {
  const [conditions, setConditions] = useState({
    mutualExclusion: true,
    holdAndWait: true,
    noPreemption: true,
    circularWait: true,
  });

  const toggle = (key: keyof typeof conditions) => {
    setConditions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allActive = Object.values(conditions).every(Boolean);
  const brokenKey = Object.entries(conditions).find(([_, v]) => !v)?.[0];

  const getBrokenExplanation = () => {
    switch (brokenKey) {
      case 'mutualExclusion':
        return 'Virtual spooling or shareable access is enabled. Multiple processes can access the resource, so neither process is blocked waiting.';
      case 'holdAndWait':
        return 'Processes must request all resources at once or release held resources before requesting new ones. No partial holding while waiting.';
      case 'noPreemption':
        return 'The OS can forcibly revoke resources from waiting processes and reassign them, immediately unblocking the resource conflict.';
      case 'circularWait':
        return 'Strict resource ordering is enforced (Havender’s rule). Requests must strictly follow ascending rank order, making circular loops mathematically impossible.';
      default:
        return 'At least one necessary condition has been removed. Deadlock cannot occur.';
    }
  };

  return (
    <section id="conditions">
      <Rv>
        <h2>
          Four things <span className="g">must be true.</span>
        </h2>
        <p className="lead">
          Deadlock needs all four Coffman conditions at once. Remove any one and it cannot happen.
        </p>

        <div className="grid">
          {[
            ['Mutual exclusion', 'Only one program can use a resource at a time.'],
            ['Hold and wait', 'A program keeps what it has while asking for more.'],
            ['No preemption', 'Nobody can take a resource away by force.'],
            ['Circular wait', 'A ring of programs, each waiting for the next.'],
          ].map(([a, b]) => (
            <div className="card" key={a}>
              <h3>{a}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>

        <div className="stage" style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 12 }}>Interactive Condition Breaker</h3>
          <p className="small" style={{ margin: '0 0 18px' }}>
            Toggle any condition off to observe how the deadlock scenario dissolves:
          </p>

          <div className="chips">
            <button
              className={`chip ${conditions.mutualExclusion ? 'a' : ''}`}
              onClick={() => toggle('mutualExclusion')}
            >
              Mutual Exclusion: {conditions.mutualExclusion ? 'ON' : 'OFF (Broken)'}
            </button>
            <button
              className={`chip ${conditions.holdAndWait ? 'a' : ''}`}
              onClick={() => toggle('holdAndWait')}
            >
              Hold & Wait: {conditions.holdAndWait ? 'ON' : 'OFF (Broken)'}
            </button>
            <button
              className={`chip ${conditions.noPreemption ? 'a' : ''}`}
              onClick={() => toggle('noPreemption')}
            >
              No Preemption: {conditions.noPreemption ? 'ON' : 'OFF (Broken)'}
            </button>
            <button
              className={`chip ${conditions.circularWait ? 'a' : ''}`}
              onClick={() => toggle('circularWait')}
            >
              Circular Wait: {conditions.circularWait ? 'ON' : 'OFF (Broken)'}
            </button>
          </div>

          <Res
            r={
              allActive
                ? {
                    st: 'unsafe',
                    msg: 'All 4 conditions are active. If programs request held resources simultaneously, circular deadlock can form.',
                  }
                : {
                    st: 'safe',
                    msg: `Deadlock prevented! ${getBrokenExplanation()}`,
                  }
            }
          />
        </div>
      </Rv>
    </section>
  );
};
