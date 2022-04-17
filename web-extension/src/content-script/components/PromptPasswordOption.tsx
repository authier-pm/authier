// @ts-nocheck
import { h } from 'preact'
import { ILoginSecret } from '../../util/useDeviceState'
import { WebInputType } from '../../../../shared/generated/graphqlBaseTypes'
import { useState, useEffect } from 'preact/hooks'
import { promptOption } from '../renderLoginCredOption'
//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './test.css'
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
  const el = document.querySelector(webInputs[0].domPath)
  const [test, setTest] = useState(el?.getBoundingClientRect())

  let resizeTimer
  window.onresize = function () {
    promptOption.remove()
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {
      setTest(el?.getBoundingClientRect())
      document.body.appendChild(promptOption)
    }, 100)
  }

  return (
    <div
      class="dropdown"
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        position: 'fixed',
        top: test?.top + 'px',
        left: (test?.left as number) + (test?.width as number) + 'px',
        right: test?.right + 'px',
        bottom: test?.bottom + 'px',
        margin: '5px'
      }}
    >
      <button className="dropbtn">Dropdown</button>
      <div className="dropdown-content">
        {loginCredentials.map((el) => (
          <a
            onClick={async () => {
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
