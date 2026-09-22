import {
  GetUserNewDevicePolicyDocument,
  useUpdateNewDevicePolicyMutation,
  useGetUserNewDevicePolicyQuery
} from './NewDevicePolicyOnboarding.codegen'
import { NewDevicePolicyDialog } from './NewDevicePolicyDialog'

export const NewDevicePolicyOnboarding = () => {
  const [updateNewDevicePolicy, { loading, error }] =
    useUpdateNewDevicePolicyMutation({
      errorPolicy: 'all',
      update(cache, result) {
        const user = result.data?.me.setNewDevicePolicy
        if (!user?.newDevicePolicy || result.errors?.length) return
        cache.writeQuery({
          query: GetUserNewDevicePolicyDocument,
          data: { me: { ...user, __typename: 'UserQuery' } }
        })
      }
    })
  const { data } = useGetUserNewDevicePolicyQuery({
    fetchPolicy: 'network-only'
  })

  if (data?.me?.newDevicePolicy !== null) return null

  return (
    <NewDevicePolicyDialog
      saving={loading}
      error={error?.message}
      onSave={async (newDevicePolicy) => {
        await updateNewDevicePolicy({ variables: { newDevicePolicy } })
      }}
    />
  )
}
