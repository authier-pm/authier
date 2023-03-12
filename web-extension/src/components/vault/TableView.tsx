import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable
} from '@tanstack/react-table'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { useVirtual } from 'react-virtual'
import {
  Box,
  Center,
  chakra,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons'

export type DataTableProps<Data extends object> = {
  data: Data[]
  columns: ColumnDef<Data, any>[]
}
type DataProperties = {
  loginCredentials: {
    url: string
    label: string
    password: string
    username: string
  }
}

export function DataTable({ filter }: { filter: string }) {
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets: search } = React.useContext(DeviceStateContext)

  const data = search(debouncedSearchTerm)

  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns = React.useMemo<ColumnDef<DataProperties>[]>(
    () => [
      {
        id: 'username',
        accessorFn: (row) => row.loginCredentials.username,
        cell: (info) => {
          return info.getValue()
        }
      },
      {
        id: 'url',
        accessorFn: (row) => row.loginCredentials.url,
        cell: (info) => {
          return info.getValue()
        }
      },
      {
        accessorFn: (row) => row.loginCredentials.password,
        id: 'password',
        cell: (info) => info.getValue(),
        header: () => <span>Password</span>
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 10
  })
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0

  return (
    <Center>
      <Table>
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <Th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <chakra.span pl="4">
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === 'desc' ? (
                          <TriangleDownIcon aria-label="sorted descending" />
                        ) : (
                          <TriangleUpIcon aria-label="sorted ascending" />
                        )
                      ) : null}
                    </chakra.span>
                  </Th>
                )
              })}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {paddingTop > 0 && (
            <Tr>
              <Td style={{ height: `${paddingTop}px` }} />
            </Tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<DataProperties>
            return (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <Td
                      maxW="50vw"
                      overflow={'hidden'}
                      whiteSpace="nowrap"
                      textOverflow={'ellipsis'}
                      key={cell.id}
                    >
                      <Text textOverflow="ellipsis" overflow="hidden">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Text>
                    </Td>
                  )
                })}
              </Tr>
            )
          })}
          {paddingBottom > 0 && (
            <Tr>
              <Td style={{ height: `${paddingBottom}px` }} />
            </Tr>
          )}
        </Tbody>
      </Table>
    </Center>
  )
}
