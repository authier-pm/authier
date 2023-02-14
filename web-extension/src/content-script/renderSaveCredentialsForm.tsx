// @ts-nocheck
import { PromptPassword } from './components/PromptPassword'
import { h, render } from 'preact'
import { trpc } from './contentScript'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let loginPrompt: HTMLDivElement | null

export async function renderSaveCredentialsForm(
  username: string,
  password: string,
  passwordLimit: number,
  passwordCount: number
) {
  const inputEvents = await trpc.getCapturedInputEvents.query()

  loginPrompt = document.createElement('div')
  render(
    <PromptPassword
      username={username}
      password={password}
      inputEvents={inputEvents}
      passwordLimit={passwordLimit}
      passwordCount={passwordCount}
    />,
    loginPrompt
  )

  document.body.appendChild(loginPrompt)

  await trpc.saveLoginCredentialsModalShown.mutate({ username, password })
}
