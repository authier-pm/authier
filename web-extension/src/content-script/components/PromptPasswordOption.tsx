// @ts-nocheck
import { h } from 'preact'
import { ILoginSecret } from '../../util/useDeviceState'
import { WebInputType } from '../../../../shared/generated/graphqlBaseTypes'
import { useState, useEffect } from 'preact/hooks'
import { promptOption } from '../renderLoginCredOption'
import { enabled } from '../autofill'
//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Option.css'
import { autofill } from '../autofill'

export const PromptPasswordOption = ({
  loginCredentials,
  webInputs
}: {
  loginCredentials: ILoginSecret[]
  webInputs: Array<{
    __typename?: 'WebInputGQL'
    id: number
    url: string
    host: string
    domPath: string
    kind: WebInputType
    createdAt: string
  }>
}) => {
  console.log('GOT in option prompt', { webInputs, loginCredentials })
  const el = document.querySelector(webInputs[0].domPath)
  const [pos, setPos] = useState(el?.getBoundingClientRect())

  let resizeTimer
  window.onresize = function () {
    promptOption.remove()
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {
      setPos(el?.getBoundingClientRect())
      document.body.appendChild(promptOption)
    }, 100)
  }

  return (
    <div
      className="dropdown"
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        position: 'fixed',
        top: (pos?.top as number) - 10 + 'px',
        left: (pos?.left as number) - 30 + 'px',
        right: pos?.right + 'px',
        bottom: pos?.bottom + 'px',
        margin: '5px'
      }}
    >
      <span className="iconAuthier"></span>

      <div className="dropdown-content">
        {loginCredentials.map((el) => (
          <a
            onClick={async () => {
              //enabled = false
              autofill({
                secretsForHost: { loginCredentials: [el], totpSecrets: [] },
                autofillEnabled: true,
                extensionDeviceReady: true,
                saveLoginModalsState: undefined,
                webInputs: webInputs
              })
            }}
          >
            {el.loginCredentials.username}
          </a>
        ))}
      </div>
    </div>
  )
}

// export class Test extends Component {
//   constructor() {
//     super()
//     this.initState = el?.getBoundingClientRect()
//   }

//   render() {
//     console.log('Test', props)

//     return (
//       <div
//         class="dropdown"
//         style={{
//           zIndex: '2147483647', // max z-index according to stackoverflow
//           justifyContent: 'center',
//           alignItems: 'baseline',
//           fontFamily: 'sans-serif !important',
//           position: 'fixed',
//           top: value?.top + 'px',
//           left: (value?.left as number) + (value?.width as number) + 'px',
//           right: value?.right + 'px',
//           bottom: value?.bottom + 'px',
//           margin: '5px'
//         }}
//       >
//         <button className="dropbtn">Dropdown</button>
//         <div className="dropdown-content">
//           {loginCredentials.map((el) => (
//             <a
//               onClick={async () => {
//                 autofill({
//                   secretsForHost: { loginCredentials: [el], totpSecrets: [] },
//                   autofillEnabled: true,
//                   extensionDeviceReady: true,
//                   saveLoginModalsState: undefined,
//                   webInputs: webInputs
//                 })
//               }}
//             >
//               {el.loginCredentials.username}
//             </a>
//           ))}
//         </div>
//       </div>
//     )
//   }
// }
