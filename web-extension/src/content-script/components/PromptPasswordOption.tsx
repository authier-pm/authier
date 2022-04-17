// @ts-nocheck
import { h } from 'preact'
import { ILoginSecret } from '../../util/useDeviceState'
import { WebInputType } from '../../../../shared/generated/graphqlBaseTypes'
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
  //TODO: resize
  let elPosition = el?.getBoundingClientRect()

  return (
    <div
      class="dropdown"
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        position: 'fixed',
        top: elPosition?.top + 'px',
        left:
          (elPosition?.left as number) + (elPosition?.width as number) + 'px',
        right: elPosition?.right + 'px',
        bottom: elPosition?.bottom + 'px',
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
