import { z } from 'zod'
import { MyForm } from './tsForm'

const SignUpSchema = z.object({
  email: z.string().email('Enter a real email please.'), // renders TextField
  password: z.string(),
  address: z.string(),
  isOver18: z.boolean() // renders CheckBoxField
})

export default function MyPage() {
  function onSubmit(data: z.infer<typeof SignUpSchema>) {
    // gets typesafe data when form is submitted
    console.log(data.address)
  }

  return (
    <MyForm
      schema={SignUpSchema}
      onSubmit={onSubmit}
      renderAfter={() => <button type="submit">Submit</button>}
    />
  )
}
