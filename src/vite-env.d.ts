/// <reference types="vite/client" />

interface ImportMetaEnv {
  NODE_ENV: "development" | "production" | "test"
  readonly APP_TITLE: string
  readonly API_KEY: string
  readonly API_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare namespace NodeJS {
  interface ProcessEnv {
    //types of envs
    NODE_ENV: "development" | "production" | "test"
    PUBLIC_URL: string
    readonly API_KEY: string
    readonly API_SECRET: string
  }
}
