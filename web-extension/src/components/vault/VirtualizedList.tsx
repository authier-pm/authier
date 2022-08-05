import React, { useContext } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { Box, Flex, useColorModeValue } from '@chakra-ui/react'
import { AutoSizer, List } from 'react-virtualized'

export const VirtualizedList = () => {
  const { loginCredentials: LoginCredentials, TOTPSecrets } =
    useContext(DeviceStateContext)

  const ITEMS_COUNT = LoginCredentials.length
  const ITEM_SIZE = 250

  return (
    <AutoSizer>
      {({ height, width }) => {
        const itemsPerRow = Math.floor(width / ITEM_SIZE) || 1
        const rowCount = Math.ceil(ITEMS_COUNT / itemsPerRow)
        console.log(width)
        return (
          <List
            width={width}
            height={height}
            rowCount={rowCount}
            rowHeight={ITEM_SIZE}
            rowRenderer={({ index, key }) => {
              const items = [] as any
              const fromIndex = index * itemsPerRow
              const toIndex = Math.min(fromIndex + itemsPerRow, ITEMS_COUNT)

              for (let i = fromIndex; i < toIndex; i++) {
                items.push(
                  <Flex
                    width={'100px'}
                    height={'100px'}
                    className='Item'
                    key={i}
                  >
                    Item {i}
                  </Flex>
                )
              }

              return (
                <Flex width={'100%'} height={'100%'} className='Row' key={key}>
                  {items}
                </Flex>
              )
            }}
          />
        )
      }}
    </AutoSizer>
  )
}
