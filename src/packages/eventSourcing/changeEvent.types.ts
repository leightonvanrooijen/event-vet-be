export type ChangeEvent<T extends Record<string, any>> = {
  // Metadata
  type: string
  aggregateId: string
  // event
  data: T
}
