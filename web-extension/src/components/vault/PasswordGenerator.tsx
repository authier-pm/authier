import React from 'react'
import {
  Button,
  Checkbox,
  Collapse,
  HStack,
  VStack,
  Flex
} from '@src/components/ui/legacy'

import { Formik, Field, FormikHelpers } from 'formik'
import {
  IPasswordGeneratorConfig,
  defaultPasswordGeneratorConfig,
  generate
} from '@shared/passwordGenerator'

export const PasswordGenerator = ({
  isOpen,
  onGenerate: setInitPassword
}: {
  isOpen: boolean
  onGenerate: (password: string) => void
}) => {
  return (
    <>
      <Collapse in={isOpen} animateOpacity>
        <HStack
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          m={2}
          sx={{
            label: {
              marginBottom: '0px',
              marginTop: '0px'
            }
          }}
        >
          <Formik
            initialValues={defaultPasswordGeneratorConfig}
            onSubmit={(
              values: IPasswordGeneratorConfig,
              { setSubmitting }: FormikHelpers<IPasswordGeneratorConfig>
            ) => {
              setInitPassword(generate({ ...values }))
              setSubmitting(false)
            }}
          >
            {({ isSubmitting, handleSubmit }) => {
              return (
                <>
                  <Flex justifyContent={'right'}>
                    <Field name="length">
                      {({ field, form }) => (
                        <input
                          className="h-10 w-24 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3"
                          id="length"
                          min={5}
                          name="length"
                          style={{ marginRight: '20px' }}
                          type="number"
                          value={field.value} // TODO make this configurable per user
                          onChange={(event) => {
                            form.setFieldValue(field.name, parseInt(event.target.value))
                          }}
                        />
                      )}
                    </Field>
                    <Field name="numbers">
                      {({ field }) => (
                        <Checkbox
                          id="numbers"
                          mr={5}
                          mb={2}
                          name="numbers"
                          whiteSpace={'nowrap'}
                          isChecked={field.value}
                          {...field}
                        >
                          numbers
                        </Checkbox>
                      )}
                    </Field>
                    <Field name="symbols">
                      {({ field }) => (
                        <Checkbox
                          id="symbols"
                          name="symbols"
                          isChecked={field.value}
                          mr={5}
                          whiteSpace={'nowrap'}
                          {...field}
                        >
                          symbols
                        </Checkbox>
                      )}
                    </Field>
                    <Field name="uppercase">
                      {({ field }) => (
                        <Checkbox
                          id="uppercase"
                          name="uppercase"
                          isChecked={field.value}
                          mr={5}
                          whiteSpace={'nowrap'}
                          {...field}
                        >
                          uppercase
                        </Checkbox>
                      )}
                    </Field>
                    <Field name="lowercase">
                      {({ field }) => (
                        <Checkbox
                          id="lowercase"
                          name="lowercase"
                          isChecked={field.value}
                          mr={5}
                          whiteSpace={'nowrap'}
                          {...field}
                        >
                          lowercase
                        </Checkbox>
                      )}
                    </Field>
                  </Flex>
                  <Button
                    w={150}
                    size={'sm'}
                    colorScheme="teal"
                    isLoading={isSubmitting}
                    onClick={() => {
                      handleSubmit()
                    }}
                  >
                    Generate
                  </Button>
                </>
              )
            }}
          </Formik>
        </HStack>
      </Collapse>
    </>
  )
}
