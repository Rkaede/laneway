/// <reference types="vite/client" />

// Set at build time in vite.config.ts
interface ImportMetaEnv {
  readonly VITE_APP_BUILD_DATE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_GIT_BRANCH_NAME: string;
  readonly VITE_GIT_COMMIT_HASH: string;
}
