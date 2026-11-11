import type { Page, Route } from '@playwright/test'

export const emailApprovalOrigin = 'https://approval.example.test'
export const emailApprovalToken = 'a'.repeat(64)

type Decision = 'approve' | 'reject'
type Result = 'approved' | 'waiting-for-device' | 'rejected' | 'invalid'
type PageRenderers = {
  review: () => Response
  result: (result: Result) => Response
}

const renderResponse = async (route: Route, response: Response) =>
  route.fulfill({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text()
  })

// Run in Playwright's Node process, outside the Vite scenario registry. Passing
// the production renderers keeps backend modules out of the browser bundle and
// preserves their real CSP, response headers, form actions and inline script.
export const prepareNewDeviceEmailApprovalScenario = async (
  page: Page,
  renderers: PageRenderers,
  options: {
    requiresBoth?: boolean
    rejectIntent?: boolean
    expired?: boolean
    unrecognizedDevice?: boolean
  } = {}
) => {
  const requests: { method: string; url: string }[] = []
  const decisions: Decision[] = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    requests.push({ method: request.method(), url: request.url() })
    const url = new URL(request.url())
    if (url.origin !== emailApprovalOrigin) return route.abort()
    if (request.method() === 'GET' && url.pathname === '/approve-new-device')
      return renderResponse(route, renderers.review())
    if (request.method() !== 'POST') return route.abort()
    if (options.expired)
      return renderResponse(route, renderers.result('invalid'))
    if (url.pathname === '/approve-new-device/review') {
      const body = request.postDataJSON() as { token?: unknown }
      if (body.token !== emailApprovalToken)
        return renderResponse(route, renderers.result('invalid'))
      return route.fulfill({
        json: {
          deviceName: options.unrecognizedDevice
            ? 'Unrecognized laptop'
            : 'Chrome on Linux',
          ipAddress: options.unrecognizedDevice ? '192.0.2.20' : '192.0.2.10',
          requiresBoth: options.requiresBoth ?? false
        }
      })
    }
    if (
      new URLSearchParams(request.postData() ?? '').get('token') !==
      emailApprovalToken
    )
      return renderResponse(route, renderers.result('invalid'))
    if (url.pathname === '/reject-new-device') {
      decisions.push('reject')
      return renderResponse(route, renderers.result('rejected'))
    }
    if (url.pathname === '/approve-new-device') {
      decisions.push('approve')
      return renderResponse(
        route,
        renderers.result(
          options.requiresBoth ? 'waiting-for-device' : 'approved'
        )
      )
    }
    return route.abort()
  })
  return {
    requests,
    decisions,
    url: `${emailApprovalOrigin}/approve-new-device#token=${emailApprovalToken}${options.rejectIntent ? '&action=reject' : ''}`
  }
}
