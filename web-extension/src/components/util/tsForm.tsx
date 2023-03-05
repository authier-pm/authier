import { createTsForm, createUniqueFieldSchema } from '@ts-react/form'
import { z } from 'zod'
import SelectField from '../form/SelectField'
import CheckBoxField from '../form/CheckBoxField'
import { TextField } from '../form/TextFiled'
import FormComponent from '../form/FormComponent'

export const selectFieldSchema = createUniqueFieldSchema(
  z.string(),
  'selectId' // You need to pass a string ID, it can be anything but has to be set explicitly and be unique.
)

// create the mapping
const mapping = [
  [z.string(), TextField],
  [z.boolean(), CheckBoxField],
  [selectFieldSchema, SelectField] as const
] as const // 👈 `as const` is necessary

// A typesafe React component
export const Form = createTsForm(mapping, { FormComponent })
