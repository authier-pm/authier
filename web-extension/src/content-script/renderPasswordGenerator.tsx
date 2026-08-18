import { h, render } from 'preact'
import { PromptPasswordGenerator } from './components/PromptPasswordGenerator'
import { authierOverlayBaseStyles } from './components/authierOverlayStyles'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let generatorDiv: HTMLDivElement | null
let generatorContainer: HTMLDivElement | null = null

const passwordGeneratorStyles = `
  ${authierOverlayBaseStyles}

  :host {
    all: initial;
    position: fixed !important;
    z-index: 2147483647 !important;
  }

  .authier-generator {
    height: 36px;
    position: fixed;
    width: 36px;
    z-index: 2147483647;
  }

  .authier-generator__trigger {
    all: unset;
    align-items: center;
    background: #0f73ff;
    border: 2px solid rgba(255, 255, 255, 0.92);
    border-radius: 999px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    height: 36px;
    justify-content: center;
    transition:
      background-color 120ms ease,
      transform 120ms ease;
    width: 36px;
  }

  .authier-generator__trigger:hover {
    background: #0866e5;
    transform: scale(1.04);
  }

  .authier-generator__trigger:focus-visible {
    outline: 3px solid rgba(96, 165, 250, 0.5);
    outline-offset: 2px;
  }

  .authier-generator__logo {
    display: block;
    height: 22px;
    object-fit: contain;
    width: 22px;
  }

  .authier-generator__popover {
    background: #111827;
    border: 1px solid #334155;
    border-radius: 16px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
    padding: 14px;
    position: absolute;
    right: 0;
    width: min(296px, calc(100vw - 24px));
  }

  .authier-generator__popover[hidden] {
    display: none;
  }

  .authier-generator__popover--below {
    top: 44px;
  }

  .authier-generator__popover--above {
    bottom: 44px;
  }

  .authier-generator__eyebrow {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    margin: 0 0 8px;
  }

  .authier-generator__password {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 10px;
    color: #f8fafc;
    display: block;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      monospace;
    font-size: 14px;
    line-height: 1.35;
    margin: 0;
    overflow-wrap: anywhere;
    padding: 10px 12px;
    user-select: all;
  }

  .authier-generator__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .authier-generator__error {
    color: #fca5a5;
    font-size: 12px;
    margin: 10px 2px 0;
  }
`

export function removePasswordGenerator() {
  if (generatorContainer) {
    render(null, generatorContainer)
  }
  generatorDiv?.remove()
  generatorContainer = null
  generatorDiv = null
}

export function renderPasswordGenerator({
  input
}: {
  input: HTMLInputElement
}) {
  // pages can add password inputs repeatedly, don't stack a generator per call
  removePasswordGenerator()
  generatorDiv = document.createElement('div')
  generatorDiv.id = 'authier-password-generator'

  const shadow = generatorDiv.attachShadow({ mode: 'closed' })
  const style = document.createElement('style')
  style.textContent = passwordGeneratorStyles
  shadow.appendChild(style)

  generatorContainer = document.createElement('div')
  shadow.appendChild(generatorContainer)

  document.body.appendChild(generatorDiv)
  render(<PromptPasswordGenerator input={input} />, generatorContainer)
}
