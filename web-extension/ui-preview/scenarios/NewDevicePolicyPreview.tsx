import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { useState } from 'react'
import { NewDeviceApprovalStatus } from '@shared/NewDeviceApprovalStatus'
import { UserNewDevicePolicy } from '@shared/generated/graphqlBaseTypes'
import { NewDeviceApprovalSettings } from '@src/pages-vault/NewDeviceApprovalSettings'
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
    ? UserNewDevicePolicy.EMAIL
    : null
  let failNextSave = params.has('error')
  const masterDeviceId = params.has('nonmaster')
    ? 'preview-other-device'
    : 'preview-current-device'
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
                selected !== UserNewDevicePolicy.EMAIL &&
                selected !== UserNewDevicePolicy.OTHER_DEVICE &&
                selected !== UserNewDevicePolicy.EMAIL_OR_OTHER_DEVICE &&
                selected !== UserNewDevicePolicy.EMAIL_AND_OTHER_DEVICE &&
                selected !== UserNewDevicePolicy.MASTER_DEVICE
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
                      masterDeviceId,
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
                    masterDeviceId,
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
  const params = new URLSearchParams(location.search)
  if (params.has('pending'))
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-xl space-y-5 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6">
          <h1 className="text-2xl font-bold">Approve this browser</h1>
          <NewDeviceApprovalStatus
            policy={
              params.has('master') ? 'MASTER_DEVICE' : 'EMAIL_AND_OTHER_DEVICE'
            }
            email="alex@example.com"
            emailApprovalSentAt="2026-11-11T12:00:00Z"
            emailApprovedAt={
              params.has('emailApproved') ? '2026-11-11T12:01:00Z' : null
            }
          />
        </section>
      </main>
    )
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
      {new URLSearchParams(location.search).has('settings') && (
        <div className="mx-auto mb-10 max-w-xl px-6">
          <NewDeviceApprovalSettings />
        </div>
      )}
      <NewDevicePolicyOnboarding />
      <PolicyStatus />
    </ApolloProvider>
  )
}
