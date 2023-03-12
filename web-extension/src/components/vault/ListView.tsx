import { useContext } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AutoSizer, Grid, Column } from 'react-virtualized'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { Box } from '@chakra-ui/react'

//Inspiration => https://plnkr.co/edit/zjCwNeRZ7XtmFp1PDBsc?p=preview&preview
export const ListView = ({ filter }: { filter: string }) => {
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets: search } = useContext(DeviceStateContext)

  const filteredItems = search(debouncedSearchTerm)

  function cellRenderer({ columnIndex, key, rowIndex, style }) {
    console.log(columnIndex)
    let data

    if (columnIndex === 0) {
      data = filteredItems[rowIndex]['loginCredentials']['username']
    } else if (columnIndex == 1) {
      data = filteredItems[rowIndex]['loginCredentials']['url']
    } else if (columnIndex == 2) {
      data = filteredItems[rowIndex]['loginCredentials']['password']
    }
    return (
      <Box
        w={'30vw'}
        overflow="hidden"
        textOverflow="ellipsis"
        key={key}
        style={style}
      >
        {data}
      </Box>
    )
  }

  return (
    <AutoSizer>
      {({ width, height }) => (
        <Grid
          cellRenderer={cellRenderer}
          columnCount={3}
          columnWidth={100}
          height={height}
          rowCount={filteredItems.length}
          rowHeight={100}
          width={width}
        />
      )}
    </AutoSizer>
  )
}

// <AutoSizer>
//   {({ width, height }) => (
//     <Table
//       width={width}
//       height={height}
//       headerHeight={20}
//       rowHeight={30}
//       rowCount={ITEMS_COUNT}
//       rowGetter={({ index }) => filteredItems[index]}
//     >
//       <Column
//         label="Label"
//         dataKey="label"
//         width={100}
//         cellDataGetter={({ rowData }) => rowData.loginCredentials.label}
//       />
//       <Column
//         width={200}
//         label="Password"
//         dataKey="passowrd"
//         cellDataGetter={({ rowData }) => rowData.loginCredentials.password}
//       />
//     </Table>
//   )}
// </AutoSizer>
