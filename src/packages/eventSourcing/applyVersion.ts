export type Versioned<T extends Record<string, any>> = T & { version: number }
export const applyVersion = <T extends Record<string, any>>(obj: T, version: number = 1): Versioned<T> => ({
  ...obj,
  version,
})
