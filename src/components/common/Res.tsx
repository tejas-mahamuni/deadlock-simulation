/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, Flame, AlertOctagon, Check } from 'lucide-react';

export interface ResultStatus {
  st: 'safe' | 'granted' | 'waiting' | 'unsafe' | 'deadlock' | 'invalid';
  msg: string;
  details?: string;
}

interface ResProps {
  r: ResultStatus;
}

export const Res: React.FC<ResProps> = ({ r }) => {
  const titles: Record<ResultStatus['st'], string> = {
    safe: 'Safe state',
    granted: 'Granted',
    waiting: 'Waiting',
    unsafe: 'Unsafe, denied',
    deadlock: 'Deadlock detected',
    invalid: 'Invalid input',
  };

  const getIcon = () => {
    switch (r.st) {
      case 'safe':
      case 'granted':
        return <ShieldCheck style={{ width: 22, height: 22, color: 'var(--ok)' }} />;
      case 'waiting':
        return <Clock style={{ width: 22, height: 22, color: 'var(--wa)' }} />;
      case 'unsafe':
        return <AlertTriangle style={{ width: 22, height: 22, color: 'var(--bad)' }} />;
      case 'deadlock':
        return <Flame style={{ width: 22, height: 22, color: 'var(--bad)' }} />;
      case 'invalid':
        return <AlertOctagon style={{ width: 22, height: 22, color: 'var(--bad)' }} />;
    }
  };

  return (
    <div className={`res st-${r.st}`} role="status" aria-live="polite">
      <b>
        {getIcon()}
        <span>{titles[r.st]}</span>
      </b>
      <p>{r.msg}</p>
      {r.details && (
        <p style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>
          {r.details}
        </p>
      )}
    </div>
  );
};
