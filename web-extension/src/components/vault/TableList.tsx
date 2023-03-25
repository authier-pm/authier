import { useContext, useState } from 'react'
import {
  IconButton,
  Tooltip,
  useToast,
  Box,
  Text,
  Flex,
  Checkbox,
  HStack
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { FixedSizeList as List } from 'react-window'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { getDecryptedSecretProp } from '@src/background/ExtensionDevice'
import { AutoSizer } from 'react-virtualized'

export function TableList({ filter }: { filter: string }) {
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets: search } = useContext(DeviceStateContext)
  const data = search(debouncedSearchTerm)

  const [selected, setSelected] = useState<string[]>([])
  const toast = useToast()

  const handleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id))
    } else {
      setSelected([...selected, id])
    }
  }

  const handleEdit = (row: ILoginSecret | ITOTPSecret) => {
    // Your edit logic here
    toast({
      title: `Editing row ${row.id}`,
      status: 'info',
      duration: 3000,
      isClosable: true
    })
  }

  const handleRemove = (row: ILoginSecret | ITOTPSecret) => {
    // Your remove logic here
    toast({
      title: `Removing row ${row.id}`,
      status: 'warning',
      duration: 3000,
      isClosable: true
    })
  }

  const Row = ({
    index,
    style
  }: {
    index: number
    style: React.CSSProperties
  }) => {
    const row = data[index]

    return (
      <Flex
        p={10}
        m={['auto', '3']}
        key={row.id}
        cursor="pointer"
        justify="space-between"
        align="center"
        style={style}
      >
        <Flex
          p={1}
          justifyContent="inherit"
          w="100%"
          _hover={{
            bg: 'gray.700'
          }}
        >
          <HStack spacing={5} onClick={() => handleSelect(row.id)}>
            <Checkbox
              isChecked={selected.includes(row.id)}
              onChange={() => handleSelect(row.id)}
              mr={2}
            />
            <Box maxW={'xs'}>
              <Text
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
                fontWeight="bold"
              >
                {row.kind === 'TOTP'
                  ? row.totp.label
                  : row.loginCredentials.username}
              </Text>

              <Text
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
              >
                {row.kind === 'TOTP' ? row.totp.url : row.loginCredentials.url}
              </Text>
            </Box>
          </HStack>
          <Flex>
            <Tooltip label="Edit" aria-label="Edit">
              <IconButton
                aria-label="Edit"
                icon={<EditIcon />}
                onClick={() => handleEdit(row)}
                mr={2}
              />
            </Tooltip>
            <Tooltip label="Delete" aria-label="Delete">
              <IconButton
                aria-label="Delete"
                icon={<DeleteIcon />}
                onClick={() => handleRemove(row)}
              />
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
    )
  }

  // make table row on full width

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          itemCount={data.length}
          itemSize={50}
          width={width}
          height={height}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  )
}
