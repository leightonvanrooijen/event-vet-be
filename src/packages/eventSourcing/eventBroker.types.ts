import { VersionedChangeEvent } from "./testEventDb"

export type BrokerEvent = VersionedChangeEvent<Record<string, any>>
