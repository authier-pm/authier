import * as Yup from 'yup'

export interface credentialValues {
  url: string
  label: string
  username: string
  password: string
}

export interface totpValues {
  secret: string
  url: string
  label: string
  digits: number
  period: number
}
export const PasswordSchema = Yup.object().shape({
  url: Yup.string().url('Invalid URL').required('Required'),
  label: Yup.string(),
  username: Yup.string().required('Required'),
  password: Yup.string().required('Required')
})

export const TOTPSchema = Yup.object().shape({
  url: Yup.string().url('Invalid URL').required('Required'),
  label: Yup.string(),
  secret: Yup.string().required('Required'),
  iconUrl: Yup.string().url('Invalid URL').nullable(),
  digits: Yup.number().min(6).max(8).required('Required'),
  period: Yup.number().min(30).max(120).required('Required')
})
