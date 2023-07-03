import { useContext, useState } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AutoSizer, List } from 'react-virtualized'
import { useDebounce } from '@src/pages-vault/useDebounce'
import { IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { EditIcon, DeleteIcon, CopyIcon } from '@chakra-ui/icons'
import { Tb2Fa } from 'react-icons/tb'
import { GrUserAdmin } from 'react-icons/gr'
import { Center, Box, Flex, Text, useToast } from '@chakra-ui/react'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { Link } from 'react-router-dom'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import { getDecryptedSecretProp } from '@src/background/ExtensionDevice'
import browser from 'webextension-polyfill'
import { Txt } from '../util/Txt'
import { t } from '@lingui/macro'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { authierColors } from '@shared/chakraRawTheme'

export function VaultListItem({
  secret
}: {
  secret: ILoginSecret | ITOTPSecret
}) {
  const [isVisible, setIsVisible] = useState(false)

  const { deviceState } = useContext(DeviceStateContext)
  const toast = useToast()

  const username = getDecryptedSecretProp(secret, 'username')
  const password = getDecryptedSecretProp(secret, 'password')
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
        transition={'transform .2s ease-in-out'}
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        _hover={{ transform: 'scale(1.05)' }}
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
      >
        <Box bg={'gray.100'} h="70%" pos={'relative'}>
          <Box>
            <Center h={130}>
              <SecretItemIcon url={secretUrl} iconUrl={iconUrl} />
            </Center>

            <Txt
              color={'blue.800'}
              position="relative"
              bottom={'15px'}
              left="15px"
            >
              {username}
            </Txt>
          </Box>
          <Box
            pos="absolute"
            top={secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS ? 3 : 1}
            left={4}
          >
            {secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS ? (
              <GrUserAdmin size={13}></GrUserAdmin>
            ) : (
              <Tb2Fa color={authierColors.gray[700]} size={25}></Tb2Fa>
            )}
          </Box>
          <Flex
            display={isVisible ? 'flex' : 'none'}
            alignItems="center"
            justifyContent="center"
            zIndex={9}
            position="absolute"
            top={0}
            w="100%"
            h="full"
            sx={{
              svg: {
                position: 'absolute' // needed for DeleteSecretButton
              }
            }}
          >
            <CopyIcon
              aria-label="copy to clipboard"
              onClick={() => {
                navigator.clipboard.writeText(password)
                toast({
                  title: t`Copied to clipboard`,
                  status: 'success'
                })
                secret.lastUsedAt = new Date().toISOString()
                // TODO store SecretUsageEvent
              }}
              cursor={'pointer'}
              boxSize={29}
              padding={1.5}
              alignSelf="end"
              overflow={'visible'}
              backgroundColor={'blue.400'}
              _hover={{ backgroundColor: 'orange.500' }}
              right="0"
              top="inherit"
            />

            {secretUrl ? (
              <IconButton
                aria-label="open_item"
                colorScheme="blackAlpha"
                h={'50px'}
                w={'55px'}
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
  const ITEM_SIZE = 250

  return (
    <AutoSizer>
      {({ height, width }) => {
        const itemsPerRow = Math.floor(width / ITEM_SIZE)
        const rowCount = Math.ceil(ITEMS_COUNT / itemsPerRow)

        return (
          <List
            width={width}
            height={height - 23} //for some reason the height is 23px too much
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
