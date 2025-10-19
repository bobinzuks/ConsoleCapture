/**
 * DevTools panel UI
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

const Panel: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>ConsoleCapture DevTools Panel</h1>
      <p>Advanced console capture and analysis tools will appear here.</p>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<Panel />);
