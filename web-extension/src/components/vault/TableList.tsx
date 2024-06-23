import { useContext, useState } from 'react'
import {
  IconButton,
  Tooltip,
  Box,
  Text,
  Flex,
  Checkbox,
  HStack,
  useColorModeValue
} from '@chakra-ui/react'
import { CopyIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { FixedSizeList as List } from 'react-window'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { AutoSizer } from 'react-virtualized'
import { Link } from 'react-router-dom'
import { DeleteSecretButton } from './DeleteSecretButton'
import { authenticator } from 'otplib'
import { Trans } from '@lingui/macro'

export function TableList({ filter }: { filter: string }) {
  const { selectedItems, setSelectedItems } = useContext(DeviceStateContext)
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets: search } = useContext(DeviceStateContext)
  const data = search(debouncedSearchTerm)

  const handleSelect = (secret: ILoginSecret | ITOTPSecret) => {
    if (selectedItems.includes(secret)) {
      setSelectedItems(selectedItems.filter((s) => s !== secret))
    } else {
      setSelectedItems([...selectedItems, secret])
    }
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
    const isTotp = row.kind === 'TOTP'

    return (
      <Flex
        p={10}
        pb={0}
        pt={0}
        m={['auto', '3']}
        key={row.id}
        cursor="pointer"
        justify="space-between"
        align="center"
        style={style}
        onMouseOver={() =>
          selectedItems.length == 0 || selectedItems.includes(row)
            ? setAreIconsVisible(true)
            : null
        }
        onMouseOut={() => setAreIconsVisible(false)}
        _hover={{
          backgroundColor: useColorModeValue('gray.400', 'gray.700')
        }}
      >
        <Flex p={1} justifyContent="inherit" w="100%">
          <HStack
            onClick={() => handleSelect(row)}
            w="90%"
            justifyContent="space-between"
            alignItems="center"
            p={'1em'}
            m={'-1em'}
          >
            <Box minW={'16px'}>
              <Checkbox
                isChecked={selectedItems.includes(row)}
                onChange={() => handleSelect(row)}
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
                {isTotp ? row.totp.label : row.loginCredentials.label}
              </Text>
            </Box>

            <Text
              textOverflow="ellipsis"
              w="100%"
              textAlign="start"
              overflow="hidden"
              whiteSpace="nowrap"
            >
              {isTotp ? row.totp.url : row.loginCredentials.url}
            </Text>

            <Box w={'inherit'}>
              <Text
                textAlign="left"
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
                fontWeight="bold"
              >
                {isTotp ? '' : row.loginCredentials.username}
              </Text>
            </Box>
            <Text
              w="inherit"
              // textAlign="end"
              textAlign={'center'}
              textOverflow="ellipsis"
              overflow="hidden"
              whiteSpace="nowrap"
            >
              {showPassword || showAllPasswords
                ? isTotp
                  ? row.totp.secret
                  : row.loginCredentials.password
                : '*'.repeat(
                    isTotp
                      ? row.totp.secret.length
                      : row.loginCredentials.password.length
                  )}
            </Text>
          </HStack>

          <HStack
            justifyContent="flex-center"
            display={areIconsVisible ? 'flex' : 'none'}
            spacing={2}
          >
            <Tooltip label={isTotp ? 'Copy token' : 'Copy'} aria-label="Copy">
              <IconButton
                icon={<CopyIcon />}
                aria-label="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(
                    isTotp
                      ? authenticator.generate(row.totp.secret)
                      : row.loginCredentials.password
                  )
                }}
              />
            </Tooltip>
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
                  data: isTotp ? row.totp : row.loginCredentials
                }}
              >
                <IconButton aria-label="Edit" icon={<EditIcon />} />
              </Link>
            </Tooltip>
            <DeleteSecretButton
              secrets={selectedItems.length > 1 ? [...selectedItems] : [row]}
            >
              <IconButton
                colorScheme="red"
                aria-label="Delete"
                icon={<DeleteIcon />}
              />
            </DeleteSecretButton>
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
          <Flex w="20%" justifyContent="center">
            <Text w="100%" textAlign="center" fontWeight="bold">
              <Trans>Label</Trans>
            </Text>
          </Flex>

          <Flex w="20%" justifyContent="center">
            <Text w="100%" textAlign="center" fontWeight="bold">
              <Trans>URL</Trans>
            </Text>
          </Flex>
          <Flex w="20%" justifyContent="center">
            <Text w="100%" textAlign="center" fontWeight="bold">
              <Trans>Username</Trans>
            </Text>
          </Flex>
          <Flex w="20%" justifyContent="center">
            <HStack>
              <Text pr={4} w="100%" textAlign="end" fontWeight="bold">
                <Trans>Secret</Trans>
              </Text>
              <IconButton
                size="sm"
                aria-label={showText}
                icon={showAllPasswords ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowAllPasswords(!showAllPasswords)}
                ml={2}
                mb={2}
              />
            </HStack>
          </Flex>
          <Flex w="10%" justifyContent="center">
            <Text w="100%" textAlign="center" fontWeight="bold">
              <Trans>Actions</Trans>
            </Text>
          </Flex>
        </HStack>
      </Flex>
      <AutoSizer>
        {({ height, width }) => {
          return (
            <List
              itemCount={data.length}
              itemSize={60}
              width={width}
              height={height - 62} // for some reason autosizer does not take into account the height of the header
            >
              {Row}
            </List>
          )
        }}
      </AutoSizer>
    </>
  )
}
