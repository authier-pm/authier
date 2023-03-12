import { useContext } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { Flex } from '@chakra-ui/react'
import { AutoSizer, List } from 'react-virtualized'
import { VaultListItem } from '@src/pages-vault/VaultList'
import { useDebounce } from '@src/pages-vault/useDebounce'

//Inspiration => https://plnkr.co/edit/zjCwNeRZ7XtmFp1PDBsc?p=preview&preview
export const VirtualizedList = ({ filter }: { filter: string }) => {
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets: search } = useContext(DeviceStateContext)

  const filteredItems = search(debouncedSearchTerm)

  const ITEMS_COUNT = filteredItems.length
  const ITEM_SIZE = 270

  console.log(filteredItems)
  return (
    <AutoSizer>
      {({ height, width }) => {
        const itemsPerRow = Math.floor(width / ITEM_SIZE)
        const rowCount = Math.ceil(ITEMS_COUNT / itemsPerRow)

        return (
          <List
            className="List"
            width={width}
            height={height}
            rowCount={rowCount}
            rowHeight={ITEM_SIZE}
            rowRenderer={({ index, key, style }) => {
              const items = [] as any
              const fromIndex = index * itemsPerRow
              const toIndex = Math.min(fromIndex + itemsPerRow, ITEMS_COUNT)

              for (let i = fromIndex; i < toIndex; i++) {
                items.push(
                  <VaultListItem
                    key={filteredItems[i].id}
                    secret={filteredItems[i]}
                  ></VaultListItem>
                )
              }

              return (
                <Flex
                  flexDirection={'row'}
                  justifyContent="center"
                  alignItems={'center'}
                  w={'100%'}
                  h="100%"
                  className="Row"
                  key={key}
                  style={style}
                >
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
