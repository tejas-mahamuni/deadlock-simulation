/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { Rv } from '../common/Rv.tsx';
import { Res } from '../common/Res.tsx';
import {
  RAGGraph,
  RAGNode,
  RAGEdge,
  detectSingleInstance,
  detectMultiInstance,
  PRESET_CYCLE_NOT_DEADLOCK_RAG,
  PRESET_SINGLE_INSTANCE_DEADLOCK_RAG,
} from '../../engine/deadlockEngine.ts';

export const RagSection: React.FC = () => {
  const [graph, setGraph] = useState<RAGGraph>(() =>
    JSON.parse(JSON.stringify(PRESET_SINGLE_INSTANCE_DEADLOCK_RAG))
  );

  const [mode, setMode] = useState<'select' | 'assign' | 'request' | 'delete'>('select');
  const [edgeStart, setEdgeStart] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const cycleResult = useMemo(() => detectSingleInstance(graph), [graph]);

  const hasMultiInstance = useMemo(
    () => graph.nodes.some(n => n.type === 'resource' && (n.instances ?? 1) > 1),
    [graph.nodes]
  );

  const multiDetection = useMemo(() => {
    if (!hasMultiInstance || !cycleResult.hasCycle) return null;
    const pNodes = graph.nodes.filter(n => n.type === 'process');
    const rNodes = graph.nodes.filter(n => n.type === 'resource');
    const pMap = new Map(pNodes.map((p, i) => [p.id, i]));
    const rMap = new Map(rNodes.map((r, j) => [r.id, j]));

    const allocation = pNodes.map(() => rNodes.map(() => 0));
    const requests = pNodes.map(() => rNodes.map(() => 0));
    const available = rNodes.map(r => r.instances ?? 1);

    graph.edges.forEach(e => {
      if (e.type === 'assignment') {
        const rIdx = rMap.get(e.from);
        const pIdx = pMap.get(e.to);
        if (rIdx !== undefined && pIdx !== undefined) {
          allocation[pIdx][rIdx] += 1;
          available[rIdx] = Math.max(0, available[rIdx] - 1);
        }
      } else if (e.type === 'request') {
        const pIdx = pMap.get(e.from);
        const rIdx = rMap.get(e.to);
        if (pIdx !== undefined && rIdx !== undefined) {
          requests[pIdx][rIdx] += 1;
        }
      }
    });

    return detectMultiInstance(available, allocation, requests, pNodes.map(p => p.name));
  }, [graph, hasMultiInstance, cycleResult.hasCycle]);

  const cycleEdgeIds = useMemo(() => {
    const set = new Set<string>();
    if (!cycleResult.hasCycle) return set;
    cycleResult.cycles.forEach(cycle => {
      for (let i = 0; i < cycle.length - 1; i++) {
        const from = cycle[i];
        const to = cycle[i + 1];
        const e = graph.edges.find(edge => edge.from === from && edge.to === to);
        if (e) set.add(e.id);
      }
    });
    return set;
  }, [cycleResult, graph.edges]);

  const getNode = (id: string) => graph.nodes.find(n => n.id === id);

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    if (mode !== 'select') return;
    const node = getNode(id);
    if (!node || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y,
    };
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(40, Math.min(rect.width - 40, e.clientX - rect.left - dragOffset.current.x));
    const y = Math.max(40, Math.min(rect.height - 40, e.clientY - rect.top - dragOffset.current.y));

    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === draggingId ? { ...n, x, y } : n)),
    }));
  };

  const handleMouseUp = () => setDraggingId(null);

  const handleNodeClick = (node: RAGNode) => {
    if (mode === 'delete') {
      setGraph(prev => ({
        nodes: prev.nodes.filter(n => n.id !== node.id),
        edges: prev.edges.filter(e => e.from !== node.id && e.to !== node.id),
      }));
      return;
    }

    if (mode === 'assign') {
      if (!edgeStart) {
        if (node.type !== 'resource') return;
        setEdgeStart(node.id);
      } else {
        if (node.type !== 'process') {
          setEdgeStart(null);
          return;
        }
        const newEdge: RAGEdge = {
          id: `e_${Date.now()}`,
          from: edgeStart,
          to: node.id,
          type: 'assignment',
        };
        setGraph(prev => ({ ...prev, edges: [...prev.edges, newEdge] }));
        setEdgeStart(null);
      }
    } else if (mode === 'request') {
      if (!edgeStart) {
        if (node.type !== 'process') return;
        setEdgeStart(node.id);
      } else {
        if (node.type !== 'resource') {
          setEdgeStart(null);
          return;
        }
        const newEdge: RAGEdge = {
          id: `e_${Date.now()}`,
          from: edgeStart,
          to: node.id,
          type: 'request',
        };
        setGraph(prev => ({ ...prev, edges: [...prev.edges, newEdge] }));
        setEdgeStart(null);
      }
    }
  };

  const handleEdgeClick = (edgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'delete') {
      setGraph(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));
    }
  };

  const addProcess = () => {
    const count = graph.nodes.filter(n => n.type === 'process').length;
    const name = `P${count + 1}`;
    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, { id: name, type: 'process', name, x: 120 + (count * 60) % 360, y: 110 }],
    }));
  };

  const addResource = () => {
    const count = graph.nodes.filter(n => n.type === 'resource').length;
    const name = `R${count + 1}`;
    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, { id: name, type: 'resource', name, instances: 1, x: 160 + (count * 70) % 360, y: 260 }],
    }));
  };

  return (
    <section id="rag">
      <Rv>
        <h2>
          See loops in the <span className="g">allocation graph.</span>
        </h2>
        <p className="lead">
          Draw processes (circles) and resources (rectangles). Watch cycles illuminate and flow in real-time. Single-instance cycles mean deadlock; multi-instance cycles require reduction proof.
        </p>

        <div className="stage">
          {/* Controls toolbar */}
          <div className="chips">
            <button
              className="chip"
              onClick={() => {
                setGraph(JSON.parse(JSON.stringify(PRESET_SINGLE_INSTANCE_DEADLOCK_RAG)));
                setEdgeStart(null);
              }}
            >
              Preset: Single-instance deadlock
            </button>
            <button
              className="chip"
              onClick={() => {
                setGraph(JSON.parse(JSON.stringify(PRESET_CYCLE_NOT_DEADLOCK_RAG)));
                setEdgeStart(null);
              }}
            >
              Preset: Cycle but no deadlock
            </button>
            <button className="chip" onClick={addProcess}>
              + Process
            </button>
            <button className="chip" onClick={addResource}>
              + Resource
            </button>
            <button
              className="chip"
              onClick={() => {
                setGraph({ nodes: [], edges: [] });
                setEdgeStart(null);
              }}
            >
              Clear
            </button>
          </div>

          <div className="chips" style={{ marginBottom: 12 }}>
            <button className={`chip ${mode === 'select' ? 'a' : ''}`} onClick={() => { setMode('select'); setEdgeStart(null); }}>
              Drag / Select
            </button>
            <button className={`chip ${mode === 'assign' ? 'a' : ''}`} onClick={() => { setMode('assign'); setEdgeStart(null); }}>
              Assign (Resource → Process)
            </button>
            <button className={`chip ${mode === 'request' ? 'a' : ''}`} onClick={() => { setMode('request'); setEdgeStart(null); }}>
              Request (Process → Resource)
            </button>
            <button className={`chip ${mode === 'delete' ? 'a' : ''}`} onClick={() => { setMode('delete'); setEdgeStart(null); }}>
              Delete element
            </button>
          </div>

          {edgeStart && (
            <p className="small" style={{ margin: '0 0 10px', color: '#0071e3', fontWeight: 600 }}>
              Started at {edgeStart}. Now click the target node.
            </p>
          )}

          {/* SVG Canvas */}
          <div style={{ background: 'var(--bg)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--ln)' }}>
            <svg
              ref={svgRef}
              style={{ width: '100%', height: 420, display: 'block', cursor: mode === 'select' ? 'grab' : 'crosshair' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <defs>
                <marker id="arrow-assign" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#0071e3" />
                </marker>
                <marker id="arrow-request" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
                </marker>
                <marker id="arrow-cycle" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#e5484d" />
                </marker>
              </defs>

              {/* Edges */}
              {graph.edges.map(edge => {
                const f = getNode(edge.from);
                const t = getNode(edge.to);
                if (!f || !t) return null;
                const isCycle = cycleEdgeIds.has(edge.id);
                const isAssign = edge.type === 'assignment';

                return (
                  <g key={edge.id} onClick={e => handleEdgeClick(edge.id, e)}>
                    <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="16" />
                    <line
                      className={isCycle ? 'rag-cycle-edge' : ''}
                      x1={f.x}
                      y1={f.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={isCycle ? '#e5484d' : isAssign ? '#0071e3' : '#d97706'}
                      strokeWidth={isCycle ? '3.5' : '2.5'}
                      strokeDasharray={isCycle ? '8 4' : isAssign ? 'none' : '6 4'}
                      markerEnd={isCycle ? 'url(#arrow-cycle)' : isAssign ? 'url(#arrow-assign)' : 'url(#arrow-request)'}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {graph.nodes.map(node => {
                const isProc = node.type === 'process';
                const isStart = edgeStart === node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={e => handleMouseDownNode(e, node.id)}
                    onClick={() => handleNodeClick(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isProc ? (
                      <g>
                        <circle
                          r="28"
                          fill="var(--bg)"
                          stroke={isStart ? 'var(--tx)' : '#0071e3'}
                          strokeWidth="3"
                        />
                        <text textAnchor="middle" dy=".35em" fontSize="14" fontWeight="700" fill="var(--tx)">
                          {node.name}
                        </text>
                      </g>
                    ) : (
                      <g>
                        <rect
                          x="-32"
                          y="-24"
                          width="64"
                          height="48"
                          rx="12"
                          fill="var(--bg)"
                          stroke={isStart ? 'var(--tx)' : '#7c3aed'}
                          strokeWidth="3"
                        />
                        <text x="0" y="-4" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--tx)">
                          {node.name}
                        </text>
                        {/* Instance dots */}
                        <g transform="translate(0, 11)">
                          {Array.from({ length: node.instances || 1 }).map((_, i) => {
                            const count = node.instances || 1;
                            const startX = -((count - 1) * 8) / 2;
                            return <circle key={i} cx={startX + i * 8} cy="0" r="2.5" fill="var(--tx)" />;
                          })}
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Result card */}
          {cycleResult.hasCycle ? (
            hasMultiInstance && multiDetection && !multiDetection.deadlocked ? (
              <Res
                r={{
                  st: 'safe',
                  msg: `Cycle found (${cycleResult.cycleDescriptions.join(' | ')}), but NOT proof of deadlock in multi-instance systems. Outside processes finish and return their instances, breaking the cycle. Zero processes deadlocked.`,
                }}
              />
            ) : (
              <Res
                r={{
                  st: 'deadlock',
                  msg: `Cycle detected: ${cycleResult.cycleDescriptions.join(' | ')}. In single-instance systems, a cycle is a necessary and sufficient proof of deadlock.`,
                }}
              />
            )
          ) : (
            <Res
              r={{
                st: 'safe',
                msg: 'No cycles found in the Resource Allocation Graph. The system is free of circular waiting.',
              }}
            />
          )}
        </div>
      </Rv>
    </section>
  );
};
