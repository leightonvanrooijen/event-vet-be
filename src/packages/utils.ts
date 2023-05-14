export const throwIfEmpty = (value: string | any[], message: string) => {
  if (Array.isArray(value) && value.length === 0) throw new Error(message)
  if (!value) throw new Error(message)
}
