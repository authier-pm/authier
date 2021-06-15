import { browser, Tabs } from 'webextension-polyfill-ts'

/**
 * Executes a string of Javascript on the current tab
 * @param code The string of code to execute on the current tab
 */
export const executeScriptInCurrentTab = async (code: string) => {
  // Query for the active tab in the current window
  const tabs: Tabs.Tab[] = await browser.tabs.query({
    active: true,
    currentWindow: true
  })

  // Pulls current tab from browser.tabs.query response
  const currentTab: Tabs.Tab | undefined = tabs[0]

  // Short circuits function execution is current tab isn't found
  if (!currentTab) {
    return
  }

  console.log(currentTab.favIconUrl)

  // Executes the script in the current tab
  return browser.tabs.executeScript(currentTab.id, {
    code
  })
}
