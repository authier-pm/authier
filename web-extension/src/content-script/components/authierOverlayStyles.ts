export const authierOverlayBaseStyles = `
  *, *::before, *::after {
    box-sizing: border-box;
  }

  .authier-surface {
    color: #f8fafc;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.4;
  }

  .authier-button {
    all: unset;
    align-items: center;
    border: 1px solid transparent;
    border-radius: 999px;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    height: 36px;
    justify-content: center;
    padding: 0 16px;
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      transform 120ms ease;
    white-space: nowrap;
  }

  .authier-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .authier-button:focus-visible {
    outline: 3px solid rgba(96, 165, 250, 0.45);
    outline-offset: 2px;
  }

  .authier-button:disabled {
    cursor: default;
    opacity: 0.62;
  }

  .authier-button--primary {
    background: #0f73ff;
    color: #ffffff;
  }

  .authier-button--primary:hover:not(:disabled) {
    background: #0866e5;
  }

  .authier-button--secondary {
    background: #1e293b;
    border-color: #475569;
    color: #e2e8f0;
  }

  .authier-button--secondary:hover:not(:disabled) {
    background: #334155;
    border-color: #64748b;
  }

  .authier-icon-button {
    all: unset;
    align-items: center;
    border-radius: 999px;
    box-sizing: border-box;
    color: #94a3b8;
    cursor: pointer;
    display: inline-flex;
    height: 32px;
    justify-content: center;
    width: 32px;
  }

  .authier-icon-button:hover {
    background: #1e293b;
    color: #ffffff;
  }

  .authier-icon-button:focus-visible {
    outline: 3px solid rgba(96, 165, 250, 0.45);
    outline-offset: 1px;
  }
`
