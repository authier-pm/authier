import * as React from 'react'
import {
  ColumnDef,
  ColumnResizeMode,
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
import { HTMLProps } from 'react'

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

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null!)

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate
    }
  }, [ref, indeterminate])

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' cursor-pointer'}
      {...rest}
    />
  )
}

export function DataTable({ filter }: { filter: string }) {
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets: search } = React.useContext(DeviceStateContext)

  const data = search(debouncedSearchTerm)

  const [sorting, setSorting] = React.useState<SortingState>([])

  const defaultColumns = React.useMemo<ColumnDef<DataProperties>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler()
              }}
            />
          </div>
        )
      },
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

  const [columns] = React.useState<typeof defaultColumns>(() => [
    ...defaultColumns
  ])

  const [columnResizeMode, setColumnResizeMode] =
    React.useState<ColumnResizeMode>('onChange')

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
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
    <Table overflow="hidden" layout="fixed">
      <Thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <Tr display="flex" key={headerGroup.id}>
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

                  <chakra.span pl="4" cursor="pointer">
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === 'desc' ? (
                        <TriangleDownIcon aria-label="sorted descending" />
                      ) : (
                        <TriangleUpIcon aria-label="sorted ascending" />
                      )
                    ) : null}
                  </chakra.span>
                  <Box
                    h="10px"
                    w="10px"
                    bgColor="red"
                    onMouseDown={() => header.getResizeHandler()}
                    onTouchStart={() => header.getResizeHandler()}
                    // Fix here CSS FOR THE RESIZING
                    {...{
                      className: `resizer ${
                        header.column.getIsResizing() ? 'isResizing' : ''
                      }`,
                      style: {
                        transform:
                          columnResizeMode === 'onEnd' &&
                          header.column.getIsResizing()
                            ? `translateX(${
                                table.getState().columnSizingInfo.deltaOffset
                              }px)`
                            : ''
                      }
                    }}
                  />
                </Th>
              )
            })}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {paddingTop > 0 && (
          <Tr>
            <Td height={`${paddingTop}px`} />
          </Tr>
        )}
        {table.getRowModel().rows.map((row) => (
          <Tr key={row.id}>
            {row.getVisibleCells().map((cell) => {
              return (
                <Td
                  key={cell.id}
                  textOverflow="ellipsis"
                  overflow="hidden"
                  whiteSpace="nowrap"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Td>
              )
            })}
          </Tr>
        ))}
        {paddingBottom > 0 && (
          <Tr>
            <Td height={`${paddingBottom}px`} />
          </Tr>
        )}
      </Tbody>
    </Table>
  )
}
