/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Rv } from '../common/Rv.tsx';
import {
  generateProblem,
  safetyCheck,
  computeNeed,
  detectMultiInstance,
  admissionGate,
  SystemState,
  PRESET_TEXTBOOK_SAFE,
} from '../../engine/deadlockEngine.ts';

const P = (i: number) => `P${i}`;
const R = (j: number) => 'ABCDEF'[j] || `R${j}`;

export const ProblemLabSection: React.FC = () => {
  const [numProcesses, setNumProcesses] = useState<number>(5);
  const [numResources, setNumResources] = useState<number>(3);
  const [seed, setSeed] = useState<number>(42);
  const [system, setSystem] = useState<SystemState>(() => ({
    processes: PRESET_TEXTBOOK_SAFE.processes,
    resources: PRESET_TEXTBOOK_SAFE.resources,
    allocation: PRESET_TEXTBOOK_SAFE.allocation.map(r => [...r]),
    max: PRESET_TEXTBOOK_SAFE.max.map(r => [...r]),
    available: [...PRESET_TEXTBOOK_SAFE.available],
  }));

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);

  const need = computeNeed(system.max, system.allocation);
  const safety = safetyCheck(system.available, system.allocation, need, system.processes);
  const detection = detectMultiInstance(
    system.available,
    system.allocation,
    need,
    system.processes
  );
  const admission = admissionGate(
    new Array(system.resources.length).fill(2),
    system.available,
    'P_new'
  );

  const handleGenerate = (target: 'safe' | 'deadlock' | 'random') => {
    const nextSeed = (seed + 13) % 100000;
    setSeed(nextSeed);
    const targetType = target === 'safe' ? 'SAFE' : target === 'deadlock' ? 'DEADLOCK' : 'RANDOM';
    const newSys = generateProblem(numProcesses, numResources, targetType, nextSeed);
    setSystem(newSys);
  };

  const handleCellChange = (
    matrixKey: 'allocation' | 'max',
    pIdx: number,
    rIdx: number,
    val: number
  ) => {
    const updated = system[matrixKey].map(row => [...row]);
    updated[pIdx][rIdx] = Math.max(0, val);
    setSystem(prev => ({ ...prev, [matrixKey]: updated }));
  };

  const handleAvailChange = (rIdx: number, val: number) => {
    const updated = [...system.available];
    updated[rIdx] = Math.max(0, val);
    setSystem(prev => ({ ...prev, available: updated }));
  };

  const exportToJson = () => {
    const jsonStr = JSON.stringify(system, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopyFeedback('System JSON copied to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleImportJson = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (
        !parsed.allocation ||
        !parsed.max ||
        !parsed.available ||
        !Array.isArray(parsed.allocation) ||
        !Array.isArray(parsed.max) ||
        !Array.isArray(parsed.available)
      ) {
        throw new Error('Invalid schema. Must contain allocation, max, and available arrays.');
      }
      setSystem({
        processes: parsed.processes || parsed.allocation.map((_: unknown, i: number) => P(i)),
        resources: parsed.resources || parsed.available.map((_: unknown, j: number) => R(j)),
        allocation: parsed.allocation,
        max: parsed.max,
        available: parsed.available,
      });
      setShowImportModal(false);
      setImportJsonText('');
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON input');
    }
  };

  return (
    <section id="lab">
      <Rv>
        <h2>
          Custom <span className="g">Problem Lab.</span>
        </h2>
        <p className="lead">
          Generate arbitrary concurrency scenarios, tweak process matrices, export test cases to JSON, or run full multi-algorithm audits.
        </p>

        <div className="stage">
          {/* Generator Controls */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            <label style={{ fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Processes:
              <input
                type="number"
                min="2"
                max="8"
                value={numProcesses}
                onChange={e => setNumProcesses(Math.max(2, Math.min(8, parseInt(e.target.value, 10) || 2)))}
                aria-label="Process count"
              />
            </label>

            <label style={{ fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Resources:
              <input
                type="number"
                min="2"
                max="5"
                value={numResources}
                onChange={e => setNumResources(Math.max(2, Math.min(5, parseInt(e.target.value, 10) || 2)))}
                aria-label="Resource count"
              />
            </label>

            <label style={{ fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Seed:
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(parseInt(e.target.value, 10) || 1)}
                aria-label="Seed number"
              />
            </label>
          </div>

          <div className="chips">
            <button className="chip" onClick={() => handleGenerate('safe')}>
              Generate Safe State
            </button>
            <button className="chip" onClick={() => handleGenerate('deadlock')}>
              Generate Deadlock State
            </button>
            <button className="chip" onClick={() => handleGenerate('random')}>
              Generate Random Scenario
            </button>
            <button className="chip" onClick={exportToJson}>
              Export JSON
            </button>
            <button className="chip" onClick={() => setShowImportModal(!showImportModal)}>
              {showImportModal ? 'Close Import' : 'Import JSON'}
            </button>
          </div>

          {copyFeedback && (
            <p className="small" style={{ color: 'var(--ok)', fontWeight: 600, margin: '0 0 12px' }}>
              ✓ {copyFeedback}
            </p>
          )}

          {/* Import JSON Area */}
          {showImportModal && (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--ln)', borderRadius: 16, padding: 18, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Paste System State JSON</h3>
              <textarea
                rows={5}
                value={importJsonText}
                onChange={e => setImportJsonText(e.target.value)}
                placeholder='{"allocation": [[0,1,0],...], "max": [[7,5,3],...], "available": [3,3,2]}'
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--ln)',
                  background: 'var(--bg2)',
                  color: 'var(--tx)',
                }}
              />
              {importError && (
                <p className="small" style={{ color: 'var(--bad)', margin: '6px 0 0' }}>
                  {importError}
                </p>
              )}
              <div style={{ marginTop: 10 }}>
                <button className="btn" style={{ padding: '8px 18px', fontSize: 14 }} onClick={handleImportJson}>
                  Load State
                </button>
              </div>
            </div>
          )}

          {/* Matrices Table */}
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Process</th>
                  <th colSpan={system.resources.length}>Holds (Allocation)</th>
                  <th colSpan={system.resources.length}>Max Demand</th>
                  <th colSpan={system.resources.length}>Remaining Need</th>
                </tr>
              </thead>
              <tbody>
                {system.allocation.map((r, i) => (
                  <tr key={i}>
                    <td>{system.processes[i] || P(i)}</td>
                    {r.map((v, j) => (
                      <td key={`al-${j}`}>
                        <input
                          type="number"
                          min="0"
                          value={v}
                          onChange={e =>
                            handleCellChange('allocation', i, j, parseInt(e.target.value, 10) || 0)
                          }
                          aria-label={`${P(i)} Holds ${R(j)}`}
                        />
                      </td>
                    ))}
                    {system.max[i].map((v, j) => (
                      <td key={`mx-${j}`}>
                        <input
                          type="number"
                          min="0"
                          value={v}
                          onChange={e =>
                            handleCellChange('max', i, j, parseInt(e.target.value, 10) || 0)
                          }
                          aria-label={`${P(i)} Max ${R(j)}`}
                        />
                      </td>
                    ))}
                    {need[i].map((v, j) => (
                      <td key={`nd-${j}`} style={{ color: v < 0 ? 'var(--bad)' : 'var(--tx)', fontWeight: 600 }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>Free (Available)</td>
                  {system.available.map((v, j) => (
                    <td key={`av-${j}`}>
                      <input
                        type="number"
                        min="0"
                        value={v}
                        onChange={e => handleAvailChange(j, parseInt(e.target.value, 10) || 0)}
                        aria-label={`Available ${R(j)}`}
                      />
                    </td>
                  ))}
                  <td colSpan={system.resources.length * 2} className="small" style={{ textAlign: 'left' }}>
                    Resources: {system.resources.join(', ')}. Need = Max − Allocation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Multi-algorithm live evaluation */}
          <h3 style={{ marginTop: 28 }}>System State Diagnostic Report</h3>
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--ln)' }}>
              <h3>Banker’s Safety</h3>
              <p style={{ color: safety.safe ? 'var(--ok)' : 'var(--bad)', fontWeight: 600, margin: '6px 0' }}>
                {safety.safe ? 'SAFE STATE' : 'UNSAFE STATE'}
              </p>
              <p className="small">
                {safety.safe
                  ? `Safe sequence: ${safety.sequenceNames.join(' → ')}`
                  : 'No guaranteed execution sequence under peak demand.'}
              </p>
            </div>

            <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--ln)' }}>
              <h3>Deadlock Detection</h3>
              <p style={{ color: detection.deadlocked ? 'var(--bad)' : 'var(--ok)', fontWeight: 600, margin: '6px 0' }}>
                {detection.deadlocked ? 'DEADLOCKED' : 'NO DEADLOCK'}
              </p>
              <p className="small">
                {detection.deadlocked
                  ? `Stuck: {${detection.deadlockedProcesses.join(', ')}}`
                  : `Reducible: ${detection.steps.map(s => s.processName).join(' → ') || 'All finished'}`}
              </p>
            </div>

            <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--ln)' }}>
              <h3>Admission Gate</h3>
              <p style={{ color: admission.admitted ? 'var(--ok)' : 'var(--wa)', fontWeight: 600, margin: '6px 0' }}>
                {admission.admitted ? 'ADMISSION READY' : 'GATE CONGESTED'}
              </p>
              <p className="small">{admission.reason}</p>
            </div>
          </div>
        </div>
      </Rv>
    </section>
  );
};
