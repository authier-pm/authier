import { authierOverlayBaseStyles } from './authierOverlayStyles'

export const verificationCodeStyles = `
  ${authierOverlayBaseStyles}
  :host { all: initial; position: fixed !important; z-index: 2147483647 !important; }
  .authier-code button:disabled { cursor: wait; opacity: .65; }
  .authier-code__trigger {
    all: unset; position: fixed; display: flex; width: 32px; height: 32px;
    cursor: pointer; border-radius: 9px; overflow: hidden;
    box-shadow: 0 2px 8px #0003;
  }
  .authier-code__trigger img { display: block; width: 100%; height: 100%; }
  .authier-code__trigger:focus-visible, .authier-code__choice:focus-visible {
    outline: 3px solid #25ced1; outline-offset: 3px;
  }
  .authier-code__panel {
    position: fixed; width: min(320px, calc(100vw - 24px)); max-height: calc(100vh - 24px);
    background: #101e1f; border: 1px solid #375354; border-radius: 16px;
    box-shadow: 0 16px 40px #0005; padding: 14px; overflow-y: auto; outline: none;
  }
  .authier-code__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .authier-code__heading strong { font-size: 15px; font-weight: 600; }
  .authier-code__heading button { font-size: 23px; height: 24px; width: 24px; }
  .authier-code__hint { font-size: 12px; color: #afc2c3; margin: 5px 0 12px; }
  .authier-code__choices { display: grid; gap: 8px; max-height: 168px; overflow-y: auto; }
  .authier-code__choice {
    all: unset; box-sizing: border-box; cursor: pointer; display: block;
    width: 100%; padding: 12px; background: #162829; border: 1px solid #375354; border-radius: 11px;
  }
  .authier-code__choice:hover { background: #1c3435; border-color: #25ced1; }
  .authier-code__source { display: block; color: #afc2c3; font-size: 11px; }
  .authier-code__sender { display: block; font-size: 13px; margin-top: 3px; overflow-wrap: anywhere; }
  .authier-code__value { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; color: #25ced1; }
  .authier-code__value code { font-family: ui-monospace, monospace; font-size: 22px; font-weight: 600; letter-spacing: 3px; }
  .authier-code__value > span { font-size: 12px; font-weight: 600; }
  .authier-code__empty { color: #afc2c3; font-size: 12px; margin: 10px 0 2px; }
  .authier-code__error { color: #fca5a5; font-size: 12px; margin: 10px 0 2px; }
`
