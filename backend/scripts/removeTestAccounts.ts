import prismaClient from '../prisma/prismaClient'

const removeAccounts = async () => {
  await prismaClient.user.deleteMany({
    where: {
      email: {
        startsWith: 'authier_test_'
      }
    }
  })

  console.log('Accounts removed successfully')
}

removeAccounts().catch((err) => {
  console.error(err)
  process.exit(1)
})
