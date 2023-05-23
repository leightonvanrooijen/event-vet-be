export const throwIfEmpty = (value: string | any[] | undefined, message: string) => {
  if (Array.isArray(value) && value.length === 0) throw new Error(message)
  if (!value) throw new Error(message)
}
