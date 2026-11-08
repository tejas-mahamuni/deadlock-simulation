/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Rv } from '../common/Rv.tsx';

const members = [
  { name: 'Tejas Mahamuni', roll: '202401040036' },
  { name: 'Harshal Mekhe', roll: '202401040051' },
  { name: 'Siddesh Mane', roll: '202401040187' },
  { name: 'Tushar Kaldate', roll: '202401040191' },
];

const aiUsage = [
  {
    tool: 'Claude (Anthropic)',
    purpose: 'Roadmap & implementation planning',
    output: 'Structured project roadmap covering all assignment scenarios (A–F), component architecture decisions, engine API design, and section breakdown for the dashboard.',
    verification: 'Team reviewed the roadmap collaboratively, validated it against the assignment rubric, and adjusted section ordering and scope before development began.',
  },
  {
    tool: 'Google AI Studio (Gemini)',
    purpose: 'Draft 1 — full dashboard generation',
    output: 'Initial working prototype of the React + TypeScript dashboard including the deadlock engine (Banker\'s safety check, detection, prevention, RAG cycle finder), all UI sections, CSS theme, and preset test data.',
    verification: 'Every algorithm output was manually traced against textbook examples (Silberschatz). Safe sequences, detection results, and request pipeline stages were cross-checked by hand. Incorrect edge cases in the generator were identified and corrected.',
  },
  {
    tool: 'Antigravity (Google)',
    purpose: 'Bug fixing, code polish & improvements',
    output: 'Identified and fixed runtime bugs, improved TypeScript type safety, polished UI/UX interactions, added missing accessibility attributes, and optimized component re-renders.',
    verification: 'All fixes were tested in-browser. The live test suite (9 test cases) was used to confirm that no algorithm regressions were introduced. Visual and interaction changes were reviewed by team members.',
  },
];

export const AiUsageSection: React.FC = () => {
  return (
    <section id="ai">
      <Rv>
        <h2>
          Built by <span className="g">us, with AI.</span>
        </h2>
        <p className="lead">
          Transparent record of every AI tool used in this project — what it generated, and how we verified it.
        </p>

        {/* Group Members */}
        <div className="stage">
          <h3 style={{ marginBottom: 16 }}>Group Members</h3>
          <div className="grid">
            {members.map((m, i) => (
              <div className="card" key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ fontSize: 18 }}>{m.name}</h3>
                <p style={{ fontFamily: 'monospace', fontSize: 14 }}>{m.roll}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Usage Record Table */}
        <div className="stage" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 6 }}>AI Usage Record</h3>
          <p className="small" style={{ margin: '0 0 18px' }}>
            As required by the assignment: every AI tool, its purpose, what it produced, and how the team verified correctness.
          </p>

          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>AI Tool Used</th>
                  <th>Purpose</th>
                  <th>Output Generated</th>
                  <th>Student Verification</th>
                </tr>
              </thead>
              <tbody>
                {aiUsage.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.tool}</td>
                    <td style={{ textAlign: 'left', fontSize: 14 }}>{row.purpose}</td>
                    <td style={{ textAlign: 'left', fontSize: 14 }}>{row.output}</td>
                    <td style={{ textAlign: 'left', fontSize: 14 }}>{row.verification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Development Pipeline Visual */}
        <div className="stage" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Development Pipeline</h3>
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { step: '1', label: 'Plan', tool: 'Claude', desc: 'Roadmap, architecture, scenario mapping', color: '#d97706' },
              { step: '2', label: 'Build', tool: 'Google AI Studio', desc: 'Full draft with engine + UI + tests', color: '#0071e3' },
              { step: '3', label: 'Polish', tool: 'Antigravity', desc: 'Bug fixes, improvements, final QA', color: '#7c3aed' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    background: 'var(--bg)',
                    border: `2px solid ${s.color}`,
                    borderRadius: 20,
                    padding: '20px 24px',
                    minWidth: 180,
                    flex: '1 1 180px',
                    maxWidth: 280,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: s.color,
                      color: '#fff',
                      display: 'inline-grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 10,
                    }}
                  >
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: 18, margin: '0 0 2px' }}>{s.label}</h3>
                  <p style={{ fontSize: 13, color: s.color, fontWeight: 600, margin: '0 0 6px' }}>{s.tool}</p>
                  <p style={{ fontSize: 13, color: 'var(--mu)', margin: 0 }}>{s.desc}</p>
                </div>
                {i < 2 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 6px',
                      fontSize: 22,
                      color: 'var(--mu)',
                      fontWeight: 700,
                    }}
                  >
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Rv>
    </section>
  );
};
