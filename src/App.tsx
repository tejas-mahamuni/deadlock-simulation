/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Rv } from './components/common/Rv.tsx';
import { StorySection } from './components/sections/StorySection.tsx';
import { ConditionsSection } from './components/sections/ConditionsSection.tsx';
import { StatesSection } from './components/sections/StatesSection.tsx';
import { RagSection } from './components/sections/RagSection.tsx';
import { BankerSection } from './components/sections/BankerSection.tsx';
import { DetectSection } from './components/sections/DetectSection.tsx';
import { PreventSection } from './components/sections/PreventSection.tsx';
import { ProblemLabSection } from './components/sections/ProblemLabSection.tsx';
import { TestsSection } from './components/sections/TestsSection.tsx';
import { GuideSection } from './components/sections/GuideSection.tsx';

const navItems = [
  { id: 'learn', label: 'Learn' },
  { id: 'conditions', label: 'Four conditions' },
  { id: 'states', label: 'Safe vs deadlock' },
  { id: 'rag', label: 'Live RAG' },
  { id: 'bankers', label: 'Banker’s lab' },
  { id: 'detect', label: 'Detection' },
  { id: 'prevent', label: 'Prevention' },
  { id: 'lab', label: 'Problem Lab' },
  { id: 'tests', label: 'Tests' },
  { id: 'guide', label: 'Guide' },
];

export default function App() {
  return (
    <>
      {/* Sticky Apple-style Nav */}
      <nav aria-label="Main Navigation">
        {navItems.map(item => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <Rv>
          <h1>
            Deadlock,<br />
            <span className="g">finally clear.</span>
          </h1>
          <p className="lead">
            A hands-on guide to how programs get stuck waiting on each other, and how an operating system stays out of trouble.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn" href="#learn">
              Start learning
            </a>
            <a className="btn s" href="#bankers">
              Skip to the lab
            </a>
            <a className="btn s" href="#guide">
              6-Min Walkthrough
            </a>
          </div>
        </Rv>
      </section>

      {/* Main Learning & Lab Sections */}
      <StorySection />
      <ConditionsSection />
      <StatesSection />
      <RagSection />
      <BankerSection />
      <DetectSection />
      <PreventSection />
      <ProblemLabSection />
      <TestsSection />
      <GuideSection />

      {/* Clean Apple-style Footer */}
      <footer>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--tx)' }}>DeadlockLab</p>
        <p style={{ margin: '6px 0 0', color: 'var(--mu)', fontSize: 13 }}>
          Interactive Operating System Concurrency Lab · Pure Algorithmic Engine
        </p>
      </footer>
    </>
  );
}
