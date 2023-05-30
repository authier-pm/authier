import { useContext, useState } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AutoSizer, List } from 'react-virtualized'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { UnlockIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { Center, Box, Flex, Text } from '@chakra-ui/react'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { Link } from 'react-router-dom'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import { getDecryptedSecretProp } from '@src/background/ExtensionDevice'
import browser from 'webextension-polyfill'
import { DeleteSecretButton } from './DeleteSecretButton'

export function VaultListItem({
  secret
}: {
  secret: ILoginSecret | ITOTPSecret
}) {
  const [isVisible, setIsVisible] = useState(false)

  const { deviceState } = useContext(DeviceStateContext)

  const secretUrl = getDecryptedSecretProp(secret, 'url')
  const iconUrl = getDecryptedSecretProp(secret, 'iconUrl')
  const label = getDecryptedSecretProp(secret, 'label')
  const bg = useColorModeValue('white', 'gray.800')

  if (!deviceState) {
    return null
  }

  return (
    <Center py={3} m={['auto', '3']}>
      <Box
        w="250px"
        h="195px"
        bg={bg}
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
      >
        <Box bg={'gray.100'} h="70%" pos={'relative'}>
          <Center h={130}>
            <SecretItemIcon url={secretUrl} iconUrl={iconUrl} />
          </Center>
          <Flex
            display={isVisible ? 'flex' : 'none'}
            alignItems="center"
            justifyContent="center"
            zIndex={9}
            position="absolute"
            top={0}
            bgColor="blackAlpha.600"
            w="100%"
            h="full"
            sx={{
              svg: {
                position: 'absolute' // needed for DeleteSecretButton
              }
            }}
          >
            <DeleteSecretButton secrets={[secret]}>
              <DeleteIcon
                cursor={'pointer'}
                boxSize={26}
                padding={1.5}
                alignSelf="end"
                overflow={'visible'}
                backgroundColor={'red.400'}
                _hover={{ backgroundColor: 'red.500' }}
                right="0"
                top="inherit"
              />
            </DeleteSecretButton>

            {secretUrl ? (
              <IconButton
                aria-label="open item"
                colorScheme="blackAlpha"
                icon={<UnlockIcon />}
                onClick={() => browser.tabs.create({ url: secretUrl })}
              />
            ) : null}
          </Flex>
        </Box>
        <Flex
          flexDirection="row"
          align="center"
          justifyContent="space-between"
          p={4}
        >
          <Text fontWeight={'bold'} fontSize={'lg'} noOfLines={1}>
            {label}
          </Text>

          <Link
            to={{
              pathname: `secret/${secret.id}`
            }}
            state={{ data: secret }}
          >
            <IconButton
              size="sm"
              display={isVisible ? 'block' : 'none'}
              aria-label="Edit item"
              colorScheme="gray"
              icon={<EditIcon />}
            />
          </Link>
        </Flex>
      </Box>
    </Center>
  )
}

//Inspiration => https://plnkr.co/edit/zjCwNeRZ7XtmFp1PDBsc?p=preview&preview
export const VirtualizedList = ({ filter }: { filter: string }) => {
  const debouncedSearchTerm = useDebounce(filter, 400)
  const { searchSecrets: search } = useContext(DeviceStateContext)

  const filteredItems = search(debouncedSearchTerm)

  const ITEMS_COUNT = filteredItems.length
  const ITEM_SIZE = 270

  return (
    <AutoSizer>
      {({ height, width }) => {
        const itemsPerRow = Math.floor(width / ITEM_SIZE)
        const rowCount = Math.ceil(ITEMS_COUNT / itemsPerRow)

        return (
          <List
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
                  />
                )
              }

              return (
                <Flex
                  flexDirection={'row'}
                  justifyContent="center"
                  alignItems={'center'}
                  w={'100%'}
                  h="100%"
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
