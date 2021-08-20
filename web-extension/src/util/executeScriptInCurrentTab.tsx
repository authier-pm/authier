import { browser, Tabs } from 'webextension-polyfill-ts'

export async function getCurrentTab(): Promise<Tabs.Tab | undefined> {
  const tabs: Tabs.Tab[] = await browser.tabs.query({
    active: true,
    currentWindow: true
  })

  // Pulls current tab from browser.tabs.query response
  const currentTab: Tabs.Tab | undefined = tabs[0]
  return currentTab
}

/**
 * Executes a string of Javascript on the current tab
 * @param code The string of code to execute on the current tab
 */
export const executeScriptInCurrentTab = async (code: string) => {
  // Query for the active tab in the current window
  const currentTab: Tabs.Tab | undefined = await getCurrentTab()

  // Short circuits function execution is current tab isn't found
  if (!currentTab) {
    return
  }

  const result = await browser.tabs.executeScript(currentTab.id, {
    code
  })

  if (result[0]) {
    console.log('~ resul1t', result)
  }

  return result[0]
  // Executes the script in the current tab
}
