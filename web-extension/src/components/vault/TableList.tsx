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
  useColorModeValue,
  Center
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { FixedSizeList as List } from 'react-window'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { AutoSizer } from 'react-virtualized'
import { Link } from 'react-router-dom'

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

  const [showAllPasswords, setShowAllPasswords] = useState(false)
  const showText = showAllPasswords ? 'Hide' : 'Show'

  const Row = ({
    index,
    style
  }: {
    index: number
    style: React.CSSProperties
  }) => {
    const [areIconsVisible, setAreIconsVisible] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
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
        onMouseOver={() => setAreIconsVisible(true)}
        onMouseOut={() => setAreIconsVisible(false)}
      >
        <Flex
          p={1}
          justifyContent="inherit"
          w="100%"
          _hover={{
            backgroundColor: useColorModeValue('gray.400', 'gray.700')
          }}
        >
          <HStack w="90%" justifyContent="space-between" alignItems="center">
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
              {showPassword || showAllPasswords
                ? row.kind === 'TOTP'
                  ? row.totp.secret
                  : row.loginCredentials.password
                : '*'.repeat(
                    row.kind === 'TOTP'
                      ? row.totp.secret.length
                      : row.loginCredentials.password.length
                  )}
            </Text>
          </HStack>
          <HStack
            justifyContent="flex-end"
            display={areIconsVisible ? 'flex' : 'none'}
            spacing={2}
          >
            <Tooltip label={showText} aria-label={showText}>
              <IconButton
                display={areIconsVisible ? 'block' : 'none'}
                aria-label={showText}
                icon={
                  showPassword || showAllPasswords ? (
                    <ViewOffIcon />
                  ) : (
                    <ViewIcon />
                  )
                }
                onClick={() => setShowPassword(!showPassword)}
              />
            </Tooltip>
            <Tooltip label="Edit" aria-label="Edit">
              <Link
                to={{
                  pathname: `secret/${row.id}`
                }}
                state={{
                  data: row.kind === 'TOTP' ? row.totp : row.loginCredentials
                }}
              >
                <IconButton aria-label="Edit" icon={<EditIcon />} />
              </Link>
            </Tooltip>
            <Tooltip label="Delete" aria-label="Delete">
              <IconButton
                aria-label="Delete"
                icon={<DeleteIcon />}
                onClick={() => handleRemove(row)}
              />
            </Tooltip>
          </HStack>
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
        <HStack mt={2} w="100%" justifyContent="space-between">
          <Flex w="33%" justifyContent="center">
            <Text w="100%" textAlign="center" fontWeight="bold">
              Label
            </Text>
          </Flex>
          <Flex w="33%" justifyContent="center">
            <Text w="100%" textAlign="center" fontWeight="bold">
              URL
            </Text>
          </Flex>
          <Flex w="33%" justifyContent="center">
            <HStack>
              <Text pr={4} w="100%" textAlign="end" fontWeight="bold">
                Secret
              </Text>
              <IconButton
                size="sm"
                aria-label={showText}
                icon={showAllPasswords ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowAllPasswords(!showAllPasswords)}
                ml={2}
              />
            </HStack>
          </Flex>
        </HStack>
      </Flex>
      <AutoSizer>
        {({ height, width }) => (
          <List
            itemCount={data.length}
            itemSize={60}
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
