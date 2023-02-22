import { FunctionComponent, useContext, useState } from 'react'

import {
  Box,
  CircularProgress,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Switch,
  useInterval
} from '@chakra-ui/react'
import { authenticator } from 'otplib'
import { TbWorld } from 'react-icons/tb'

import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AuthsList } from '@src/components/pages/AuthsList'

export const Home: FunctionComponent = () => {
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())
  const [search, setSearch] = useState('')
  const { deviceState, TOTPSecrets, currentURL } =
    useContext(DeviceStateContext)

  useInterval(() => {
    setRemainingSeconds(authenticator.timeRemaining())
  }, 1000)

  const [filterByTLDManual, setFilterByTLD] = useState<null | boolean>(null) // when in vault or browser config, show all: ;

  const filterByTLD = !currentURL
    ? true
    : filterByTLDManual === null
    ? currentURL.startsWith('http')
    : filterByTLDManual
  return (
    <>
      <Flex position="sticky" align="center" pl={4} pr={4} mt={'56px'}>
        <FormControl display="flex" alignItems="center">
          <Flex alignItems="center">
            <FormLabel mb="0">
              <Flex alignItems="center">
                <TbWorld></TbWorld> TLD
              </Flex>
            </FormLabel>
            <Switch
              mr="auto"
              isChecked={filterByTLD}
              onChange={(enabled) => {
                setFilterByTLD(enabled.target.checked)
              }}
            ></Switch>

            <Input
              ml={5}
              size="sm"
              placeholder="Search"
              onChange={(e) => {
                setFilterByTLD(false)
                if (e.target.value === '') {
                  setFilterByTLD(true)
                }
                setSearch(e.target.value)
              }}
            />
          </Flex>
        </FormControl>

        {deviceState && TOTPSecrets.length > 0 && (
          <CircularProgress
            min={1}
            ml="auto"
            max={30}
            value={30 - seconds}
            valueText={seconds.toString()}
            size="40px"
          />
        )}
      </Flex>
      <Box height={300} width={350} pr={5} pl={5} mb={2}>
        <Grid gap={3} mb={5}>
          <AuthsList filterByTLD={filterByTLD} search={search} />
        </Grid>
      </Box>
    </>
  )
}
