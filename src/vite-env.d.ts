/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BIOPLOT_AI_ENDPOINT?: string;
  readonly VITE_BIOPLOT_REMOTE_COLLABORATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
