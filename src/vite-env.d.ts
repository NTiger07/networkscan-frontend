/// <reference types="vite/client" />

type ViteEnvFallback<T> = T | undefined;

interface ImportMetaEnv {
  readonly VITE_API_URL: ViteEnvFallback<string>;
  readonly VITE_WS_URL: ViteEnvFallback<string>;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
