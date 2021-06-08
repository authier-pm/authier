import React, { FunctionComponent } from 'react'
import './styles.scss'
import { browser, Tabs } from 'webextension-polyfill-ts'
import { Button } from '@chakra-ui/button'
import { Center, Flex } from '@chakra-ui/react'

// // // //

// Scripts to execute in current tab
const scrollToTopScript = `window.scroll(0,0)`
const scrollToBottomScript = `window.scroll(0,9999999)`

/**
 * Executes a string of Javascript on the current tab
 * @param code The string of code to execute on the current tab
 */
const executeScript = async (code: string) => {
  // Query for the active tab in the current window
  const tabs: Tabs.Tab[] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })

  // Pulls current tab from browser.tabs.query response
  const currentTab: Tabs.Tab | undefined = tabs[0]

  // Short circuits function execution is current tab isn't found
  if (!currentTab) {
    return
  }

  // Executes the script in the current tab
  return browser.tabs.executeScript(currentTab.id, {
    code,
  })
}

// // // //

export const Scroller: FunctionComponent = () => {
  return (
    <div className="row">
      <Flex flexDir="column">
        <Button
          m={3}
          className="btn btn-block btn-outline-dark"
          onClick={() => executeScript(scrollToTopScript)}
        >
          Scroll To Top
        </Button>
        <Button
          m={3}
          className="btn btn-block btn-outline-dark"
          onClick={() => executeScript(scrollToBottomScript)}
        >
          Scroll To Bottom
        </Button>
      </Flex>
    </div>
  )
}
