import {
  beginMutationPaginationPreservation,
  resetPaginationForUserTableChange,
  resolveMutationPaginationPreservation,
  shouldAutoResetEquipmentPageIndex,
} from "../pagination-state"

describe("equipment pagination state", () => {
  it("keeps the current page during the next data refresh after a successful mutation", () => {
    const nextState = beginMutationPaginationPreservation({
      pageIndex: 1,
      pageSize: 10,
      preservePageOnNextDataUpdate: false,
    })

    expect(nextState).toEqual({
      pageIndex: 1,
      pageSize: 10,
      preservePageOnNextDataUpdate: true,
    })
    expect(shouldAutoResetEquipmentPageIndex(nextState)).toBe(false)
  })

  it("keeps automatic page reset disabled after the mutation-driven refresh has completed", () => {
    const nextState = resolveMutationPaginationPreservation({
      pageIndex: 1,
      pageSize: 10,
      preservePageOnNextDataUpdate: true,
    })

    expect(nextState).toEqual({
      pageIndex: 1,
      pageSize: 10,
      preservePageOnNextDataUpdate: false,
    })
    expect(shouldAutoResetEquipmentPageIndex(nextState)).toBe(false)
  })

  it("keeps automatic page reset disabled after a mutation refresh so a follow-up realtime refetch does not jump back to page 1", () => {
    const nextState = resolveMutationPaginationPreservation({
      pageIndex: 1,
      pageSize: 10,
      preservePageOnNextDataUpdate: true,
    })

    expect(shouldAutoResetEquipmentPageIndex(nextState)).toBe(false)
  })

  it("resets to page 1 when the user changes search, sorting, or filters", () => {
    const nextState = resetPaginationForUserTableChange({
      pageIndex: 3,
      pageSize: 20,
      preservePageOnNextDataUpdate: true,
    })

    expect(nextState).toEqual({
      pageIndex: 0,
      pageSize: 20,
      preservePageOnNextDataUpdate: false,
    })
    expect(shouldAutoResetEquipmentPageIndex(nextState)).toBe(false)
  })
})
