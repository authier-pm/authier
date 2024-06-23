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
  if (loginPrompt) {
    loginPrompt.remove() // remove if already in the page
  }

  const newDiv = document.createElement('div')
  newDiv.id = 'authier-save-prompt'
  loginPrompt = newDiv
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
