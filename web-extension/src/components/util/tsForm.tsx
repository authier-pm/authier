import { createTsForm, createUniqueFieldSchema } from '@ts-react/form'
import { z } from 'zod'
import SelectTextField from '../form/SelectField'
import CheckBoxField from '../form/CheckBoxField'
import { EmailField, TextField } from '../form/TextField'
import FormComponent from '../form/FormComponent'
import SelectNumberField from '../form/SelectNumberField'
import { PasswordTextField } from '../form/PasswordTextField'
import { NumberField } from '../form/NumberField'

export const selectTextFieldSchema = createUniqueFieldSchema(
  z.string(),
  'selectTextId' // You need to pass a string ID, it can be anything but has to be set explicitly and be unique.
)
export const selectNumberFieldSchema = createUniqueFieldSchema(
  z.number(),
  'selectNumberId'
)

export const inputEmailFieldSchema = createUniqueFieldSchema(
  z.string().email(),
  'inputEmailId'
)

export const inputFieldSchema = createUniqueFieldSchema(
  z.string(),
  'inputStringId'
)
export const inputPswFieldSchema = createUniqueFieldSchema(
  z.string().min(process.env.NODE_ENV === 'development' ? 1 : 10),
  'inputPswId'
)

// create the mapping
const mapping = [
  [inputFieldSchema, TextField],
  [inputEmailFieldSchema, EmailField],
  [z.number(), NumberField],
  [z.boolean(), CheckBoxField],
  [inputPswFieldSchema, PasswordTextField],
  [selectTextFieldSchema, SelectTextField] as const,
  [selectNumberFieldSchema, SelectNumberField] as const
] as const // 👈 `as const` is necessary

// A typesafe React component
export const Form = createTsForm(mapping, { FormComponent })
