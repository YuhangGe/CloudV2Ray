/// <reference types="vite/client" />

interface ImportMetaEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __TAURI_PLATFORM__: 'windows' | 'macos' | 'android';
  }
}

export {};
