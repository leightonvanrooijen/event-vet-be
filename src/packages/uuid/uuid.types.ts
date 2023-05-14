import { v4 } from "uuid"

export type Uuid = () => string
export const createUuid = () => v4()
