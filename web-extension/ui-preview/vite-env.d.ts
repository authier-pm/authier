interface ImportMetaEnv {
  readonly VITE_WEBSITE_PREVIEW_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css'
declare module '*.png' {
  const url: string
  export default url
}
