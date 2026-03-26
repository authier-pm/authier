import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { AiFillFileAdd } from 'react-icons/ai'
import { cn } from '@src/lib/cn'

export function ImportFromFile({
  onFileAccepted
}: {
  onFileAccepted: (file: File) => void
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onFileAccepted(acceptedFiles[0])
      }
    },
    [onFileAccepted]
  )

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      'text/*': ['.csv', '.json']
    },
    maxFiles: 1,
    multiple: false,
    onDrop
  })

  const dropText = isDragActive
    ? 'Drop the file here'
    : "Drag and drop a .csv or .json file here, or click to select one"

  return (
    <button
      className={cn(
        'flex w-full flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition',
        isDragActive
          ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/8'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] hover:border-[color:var(--color-primary)]/40 hover:bg-[color:var(--color-accent)]/20'
      )}
      type="button"
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-[color:var(--color-card)] text-[color:var(--color-primary)]">
        <AiFillFileAdd className="size-7" />
      </div>
      <div>
        <div className="text-base font-medium text-[color:var(--color-foreground)]">
          Import file
        </div>
        <p className="mt-2 max-w-lg text-sm leading-6 text-[color:var(--color-muted)]">
          {dropText}
        </p>
      </div>
    </button>
  )
}
