// Re-export all Electron types under the 'electron/main' subpath
// (Electron 28+ exposes the API via ESM 'electron/main', not plain 'electron')
declare module 'electron/main' {
  export * from 'electron';
}
