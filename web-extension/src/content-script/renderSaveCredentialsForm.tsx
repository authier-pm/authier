import { h, render } from 'preact'
import { PromptPassword } from './components/PromptPassword'
import { trpc } from './connectTRPC'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let loginPrompt: HTMLDivElement | null

export async function renderSaveCredentialsForm(
  username: string | null,
  password: string
) {
  const inputEvents = await trpc.getCapturedInputEvents.query()

  loginPrompt = document.createElement('div')
  render(
    <PromptPassword
      username={username}
      password={password}
      // @ts-expect-error TODO fix
      inputEvents={inputEvents}
    />,
    loginPrompt
  )

  document.body.appendChild(loginPrompt)

  await trpc.saveLoginCredentialsModalShown.mutate({ username, password })
}
