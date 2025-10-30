import '@testing-library/jest-dom';

// Polyfill: window.matchMedia for components using it
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
}

// Silence noisy console errors during expected failure tests
const originalError = console.error;
console.error = (...args) => {
  const msg = (args && args[0]) || '';
  if (typeof msg === 'string' && (msg.includes('Not implemented: HTMLCanvasElement.prototype.getContext'))) {
    return;
  }
  originalError(...args);
};


