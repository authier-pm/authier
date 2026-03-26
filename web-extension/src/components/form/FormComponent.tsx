import type { FormEventHandler, ReactNode } from 'react'

export default function FormComponent({
  children,
  formHeading,
  submitButton,
  onSubmit
}: {
  children: ReactNode
  formHeading: string
  submitButton: ReactNode
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  return (
    <div>
      <h3 className="mb-5 text-2xl font-semibold text-[color:var(--color-foreground)]">
        {formHeading}
      </h3>
      <form className="flex flex-col items-start gap-4" onSubmit={onSubmit}>
        {children}
        {submitButton}
      </form>
    </div>
  )
}
