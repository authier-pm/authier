import { useContext, useState } from 'react'
import {
  IconButton,
  Tooltip,
  useToast,
  Box,
  Text,
  Flex,
  Checkbox,
  HStack,
  useColorModeValue
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
    const [isVisible, setIsVisible] = useState(false)
    const row = data[index]

    return (
      <Flex
        p={10}
        pt={1}
        m={['auto', '3']}
        key={row.id}
        cursor="pointer"
        justify="space-between"
        align="center"
        style={style}
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
      >
        <Flex
          p={1}
          justifyContent="inherit"
          w="100%"
          _hover={{
            backgroundColor: useColorModeValue('gray.400', 'gray.700')
          }}
        >
          <HStack
            w="80%"
            justifyContent="space-between"
            onClick={() => handleSelect(row.id)}
            alignItems="center"
          >
            <Box>
              <Checkbox
                isChecked={selected.includes(row.id)}
                onChange={() => handleSelect(row.id)}
                mr={2}
              />
            </Box>
            <Box w={'inherit'}>
              <Text
                textAlign="left"
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
                fontWeight="bold"
              >
                {row.kind === 'TOTP'
                  ? row.totp.label
                  : row.loginCredentials.label}
              </Text>
            </Box>
            <Text
              textOverflow="ellipsis"
              w="100%"
              textAlign="start"
              overflow="hidden"
              whiteSpace="nowrap"
            >
              {row.kind === 'TOTP' ? row.totp.url : row.loginCredentials.url}
            </Text>
            <Text
              w="inherit"
              textAlign="end"
              textOverflow="ellipsis"
              overflow="hidden"
              whiteSpace="nowrap"
            >
              {row.kind === 'TOTP'
                ? row.totp.secret
                : row.loginCredentials.password}
            </Text>
          </HStack>
          <Flex justifyContent="flex-end" display={isVisible ? 'flex' : 'none'}>
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

  return (
    <>
      <Flex
        borderBottom="1px"
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <HStack
          mt={2}
          w="80%"
          justifyContent="space-evenly"
          alignItems="center"
        >
          <Text w="inherit" textAlign="center" fontWeight="bold">
            Label
          </Text>
          <Text w="inherit" textAlign="center" fontWeight="bold">
            URL
          </Text>
          <Text pr={4} w="inherit" textAlign="end" fontWeight="bold">
            Secret
          </Text>
        </HStack>
      </Flex>
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
    </>
  )
}
