import { ChangeEvent } from "./changeEvent.types"
import { faker } from "@faker-js/faker"
import { VersionedChangeEvent } from "./testEventDb"

export const makeFakes =
  <T extends Record<string, any>>(mockFn: (overwrite?: Partial<T>) => T) =>
  (number: number, overwrites?: Partial<T>[]) => {
    const numToLoop = new Array(number).fill(0)
    return numToLoop.map((_, index) => {
      if (overwrites?.[index]) {
        return mockFn(overwrites[index])
      }
      return mockFn()
    })
  }
const changeEventFake = (
  overrides: ChangeEvent<ReturnType<typeof dataFn>>,
  dataFn: <T extends Record<string, any>>(overrides?: Partial<T>) => T = () => ({} as any),
): ChangeEvent<ReturnType<typeof dataFn>> => {
  return {
    type: faker.name.jobType(),
    aggregateId: faker.datatype.uuid(),
    data: dataFn(),
    ...overrides,
  }
}

export const changeEventFakes = (
  dataFn: <T extends Record<string, any>>(overrides?: Partial<T>) => T = () => ({} as any),
) => makeFakes((overrides: ChangeEvent<ReturnType<typeof dataFn>>) => changeEventFake(overrides, dataFn))

const versionedChangeEventFake = (
  overrides: VersionedChangeEvent<ReturnType<typeof dataFn>>,
  dataFn: <T extends Record<string, any>>(overrides?: Partial<T>) => T = () => ({} as any),
): VersionedChangeEvent<ReturnType<typeof dataFn>> => {
  return {
    ...changeEventFake(overrides, dataFn),
    version: 1,
    ...overrides,
  }
}

export const versionedChangeEventFakes = (
  dataFn: <T extends Record<string, any>>(overrides?: Partial<T>) => T = () => ({} as any),
) =>
  makeFakes((overrides: VersionedChangeEvent<ReturnType<typeof dataFn>>) => versionedChangeEventFake(overrides, dataFn))
