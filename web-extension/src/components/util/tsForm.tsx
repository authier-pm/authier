import { createTsForm, createUniqueFieldSchema } from '@ts-react/form'
import { z } from 'zod'
import SelectTextField from '../form/SelectField'
import CheckBoxField from '../form/CheckBoxField'
import { TextField } from '../form/TextFiled'
import FormComponent from '../form/FormComponent'
import SelectNumberField from '../form/SelectNumberField'

export const selectTextFieldSchema = createUniqueFieldSchema(
  z.string(),
  'selectTextId' // You need to pass a string ID, it can be anything but has to be set explicitly and be unique.
)

export const selectNumberFieldSchema = createUniqueFieldSchema(
  z.number(),
  'selectNumberId' // You need to pass a string ID, it can be anything but has to be set explicitly and be unique.
)

// create the mapping
const mapping = [
  [z.string(), TextField],
  [z.boolean(), CheckBoxField],
  [selectTextFieldSchema, SelectTextField] as const,
  [selectNumberFieldSchema, SelectNumberField] as const
] as const // 👈 `as const` is necessary

// A typesafe React component
export const Form = createTsForm(mapping, { FormComponent })
