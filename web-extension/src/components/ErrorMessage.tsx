type ErrorMessageProps = {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="my-4 rounded-[var(--radius-md)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] px-3 py-2 text-sm text-[color:var(--color-danger)]">
      {message}
    </div>
  )
}
