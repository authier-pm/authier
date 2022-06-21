import { UnlockIcon, DeleteIcon, SettingsIcon } from '@chakra-ui/icons'
import {
  useDisclosure,
  Center,
  Box,
  useColorModeValue,
  Flex,
  IconButton,
  Text
} from '@chakra-ui/react'
import { device } from '@src/background/ExtensionDevice'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import { DeleteAlert } from '@src/components/vault/DeleteAlert'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import React, { useContext } from 'react'
import { useState } from 'react'
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  createMasonryCellPositioner,
  List,
  Masonry
} from 'react-virtualized'
import { Link } from 'react-router-dom'
import { useDeleteEncryptedSecretMutation } from './ItemList.codegen'

function Item({ data }: { data: ILoginSecret | ITOTPSecret }) {
  const [isVisible, setIsVisible] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()
  const { deviceState } = useContext(DeviceStateContext)
  if (!deviceState) {
    return null
  }
  return (
    <Center py={5} m={['auto', '3']}>
      <Box
        w="250px"
        h="195px"
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
      >
        <Box bg={'gray.100'} h="70%" pos={'relative'}>
          <Center h={130}>
            <SecretItemIcon {...data} />
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
          >
            {data.url ? (
              <IconButton
                aria-label="open item"
                colorScheme="blackAlpha"
                icon={<UnlockIcon />}
                onClick={() => chrome.tabs.create({ url: data.url })}
              />
            ) : null}

            <DeleteIcon
              cursor={'pointer'}
              boxSize={26}
              padding={1.5}
              overflow={'visible'}
              backgroundColor={'red.400'}
              _hover={{ backgroundColor: 'red.500' }}
              position={'absolute'}
              right="0"
              top="inherit"
              onClick={onOpen}
            />

            <DeleteAlert
              isOpen={isOpen}
              onClose={onClose}
              deleteItem={async () => {
                await deleteEncryptedSecretMutation({
                  variables: {
                    id: data.id
                  }
                })
                await device.state?.removeSecret(data.id)
              }}
            />
          </Flex>
        </Box>
        <Flex
          flexDirection="row"
          align="center"
          justifyContent="space-between"
          p={4}
        >
          <Text fontWeight={'bold'} fontSize={'lg'} noOfLines={1}>
            {data.label}
          </Text>

          <Link
            to={{
              pathname: `secret/${data.id}`
            }}
            state={{ data: data }}
          >
            <IconButton
              size="sm"
              display={isVisible ? 'block' : 'none'}
              aria-label="open item"
              colorScheme="gray"
              icon={<SettingsIcon />}
            />
          </Link>
        </Flex>
      </Box>
    </Center>
  )
}

const ITEM_SIZE = 100

export default function VirtualizeList({ data }: { data: any }) {
  return (
    <AutoSizer style={{ height: '85vh' }}>
      {({ height, width }) => {
        console.log(width)
        const itemsPerRow = Math.floor(width / 300)
        const rowCount = Math.ceil(data.length / itemsPerRow)

        return (
          <List
            width={width}
            height={height}
            rowCount={rowCount}
            rowHeight={data.length}
            rowRenderer={({ index, key, isScrolling }) => {
              const items: any = []
              const fromIndex = index * itemsPerRow
              const toIndex = Math.min(fromIndex + itemsPerRow, data.length)

              for (let i = fromIndex; i < toIndex; i++) {
                items.push(<Item key={i} data={data[i]} />)
              }

              return (
                <Center key={key}>
                  <Flex flexDirection="row" flexWrap="wrap" m="auto">
                    {items}
                  </Flex>
                </Center>
              )
            }}
          />
        )
      }}
    </AutoSizer>
  )
}

// ;<List
//   width={600}
//   height={600}
//   rowHeight={60}
//   rowCount={data.length}
//   rowRenderer={({ key, index, style }) => {
//     const item = data[index]
//     return <Item key={key} data={item} />
//   }}
// />
