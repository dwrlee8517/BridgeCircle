// Vitest replaces imports of the `server-only` virtual module with this file.
// In a real Next.js build, importing `server-only` from a client module raises
// a build error; in tests, that guard is moot — the shim is a no-op.
export {}
