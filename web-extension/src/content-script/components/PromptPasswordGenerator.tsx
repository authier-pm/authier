// @ts-nocheck
import { h } from 'preact'

import { useState } from 'preact/hooks'
import { generate } from 'generate-password'
//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Option.css'
import { generatorDiv } from '../renderPasswordGenerator'
import { autofillValueIntoInput } from '../autofill'

export const PromptPasswordGenerator = ({
  input
}: {
  input: HTMLInputElement
}) => {
  if (!input) {
    console.log('No web inputs in PromptPasswordOption')
    return null
  }
  const [pos, setPos] = useState(input.getBoundingClientRect())
  const [showDropdown, setShowDropdown] = useState(false)
  const [password, setPassword] = useState(
    generate({
      length: 10,
      numbers: true,
      uppercase: true,
      symbols: true,
      strict: true
    })
  )

  let resizeTimer
  window.onresize = function () {
    if (generatorDiv) {
      generatorDiv.remove()
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(function () {
        setPos(input.getBoundingClientRect())
        document.body.appendChild(generatorDiv!)
      }, 100)
    }
  }
  if (!pos) {
    console.log('No pos in PromptPasswordOption')
    return null
  }

  return (
    <div
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        position: 'fixed',
        top: (pos.top as number) - 10 + 'px',
        left: pos.left + pos.width + 'px',
        right: pos.right + 'px',
        bottom: pos.bottom + 'px'
      }}
    >
      <span
        style={{
          height: '25px',
          width: '25px',
          backgroundColor: '#3e8e41',
          display: 'block'
        }}
      ></span>

      <div
        style={{
          display: showDropdown ? 'flex' : 'none',
          justifyContent: 'space-between',
          flexDirection: 'row',
          position: 'absolute',
          backgroundColor: 'white',
          minWidth: '160px',
          zIndex: '1',
          boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)'
          /*background: url('./icon-16.png');*/
        }}
      >
        <a
          style={{
            textDecoration: 'none',
            color: 'black',
            padding: '12px 16px'
          }}
        >
          {password}
        </a>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <button
            onClick={async () => {
              setPassword(
                generate({
                  length: 10,
                  numbers: true,
                  uppercase: true,
                  symbols: true,
                  strict: true
                })
              )
            }}
          >
            Next
          </button>
          <button
            onClick={() => {
              autofillValueIntoInput(input, password)
            }}
          >
            Use
          </button>
        </div>
      </div>
    </div>
  )
}
