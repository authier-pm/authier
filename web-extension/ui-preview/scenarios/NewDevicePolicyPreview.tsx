import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { useState } from 'react'
import { UserNewDevicePolicy } from '@shared/generated/graphqlBaseTypes'
import { NewDevicePolicyOnboarding } from '@src/pages-vault/NewDevicePolicyOnboarding'
import { useGetUserNewDevicePolicyQuery } from '@src/pages-vault/NewDevicePolicyOnboarding.codegen'

function PolicyStatus() {
  const { data } = useGetUserNewDevicePolicyQuery()
  if (!data) return null
  return (
    <output data-testid="saved-policy">
      {data.me.newDevicePolicy ?? 'Not configured'}
    </output>
  )
}

function createPreviewClient() {
  const params = new URLSearchParams(location.search)
  let policy: UserNewDevicePolicy | null = params.has('configured')
    ? UserNewDevicePolicy.ALLOW
    : null
  let failNextSave = params.has('error')
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          const timer = setTimeout(() => {
            if (operation.operationName === 'UpdateNewDevicePolicy') {
              if (failNextSave) {
                failNextSave = false
                observer.error(
                  new Error('Could not save your policy. Please try again.')
                )
                return
              }
              const selected = operation.variables.newDevicePolicy
              if (
                selected !== UserNewDevicePolicy.ALLOW &&
                selected !== UserNewDevicePolicy.REQUIRE_ANY_DEVICE_APPROVAL
              ) {
                observer.error(new Error('Unexpected device policy'))
                return
              }
              policy = selected
              observer.next({
                data: {
                  me: {
                    __typename: 'UserMutation',
                    setNewDevicePolicy: {
                      __typename: 'UserGQL',
                      id: 'preview-user',
                      newDevicePolicy: policy
                    }
                  }
                }
              })
            } else {
              observer.next({
                data: {
                  me: {
                    __typename: 'UserQuery',
                    id: 'preview-user',
                    newDevicePolicy: policy
                  }
                }
              })
            }
            observer.complete()
          }, 400)
          return () => clearTimeout(timer)
        })
    )
  })
}

export function NewDevicePolicyPreview() {
  const [client] = useState(createPreviewClient)
  return (
    <ApolloProvider client={client}>
      <main className="min-h-screen p-6 sm:p-10" data-ui-preview>
        <header className="mb-10 flex items-center justify-between">
          <span className="text-xl font-bold tracking-widest text-[color:var(--color-primary)]">
            AUTHIER
          </span>
          <button
            type="button"
            className="rounded-xl border border-[color:var(--color-border)] px-4 py-2"
          >
            Settings
          </button>
        </header>
        <h2 className="text-3xl font-bold">Your vault</h2>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Your passwords, securely stored.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {['Example Mail', 'Example Cloud', 'Example Notes'].map((name) => (
            <article
              key={name}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6"
            >
              <h3 className="font-semibold">{name}</h3>
              <p className="mt-4 text-sm text-[color:var(--color-muted)]">
                alex@example.com
              </p>
              <p className="mt-4 tracking-widest">••••••••••••</p>
            </article>
          ))}
        </div>
      </main>
      <NewDevicePolicyOnboarding />
      <PolicyStatus />
    </ApolloProvider>
  )
}
