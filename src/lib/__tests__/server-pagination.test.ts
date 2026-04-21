import {
  DEFAULT_SERVER_PAGE_SIZE,
  flattenServerPages,
  getNextServerPageParam,
  getServerPaginationRange,
  toServerPaginationPage,
} from "@/lib/server-pagination"

describe("server pagination helpers", () => {
  it("builds an inclusive Supabase range that fetches one extra record", () => {
    expect(DEFAULT_SERVER_PAGE_SIZE).toBe(50)
    expect(getServerPaginationRange(0)).toEqual({ from: 0, to: 50 })
    expect(getServerPaginationRange(2)).toEqual({ from: 100, to: 150 })
  })

  it("trims the extra record and exposes the next page when more data exists", () => {
    const records = Array.from({ length: 51 }, (_, index) => ({ id: index + 1 }))
    const page = toServerPaginationPage(records, 0)

    expect(page.items).toHaveLength(50)
    expect(page.nextPage).toBe(1)
    expect(getNextServerPageParam(page)).toBe(1)
  })

  it("returns no next page when the fetched page is not overfilled", () => {
    const records = Array.from({ length: 50 }, (_, index) => ({ id: index + 1 }))
    const page = toServerPaginationPage(records, 3)

    expect(page.items).toHaveLength(50)
    expect(page.nextPage).toBeNull()
    expect(getNextServerPageParam(page)).toBeUndefined()
  })

  it("flattens all loaded pages into a single list", () => {
    expect(
      flattenServerPages({
        pages: [
          { items: [{ id: 1 }], nextPage: 1 },
          { items: [{ id: 2 }], nextPage: null },
        ],
      }),
    ).toEqual([{ id: 1 }, { id: 2 }])
  })
})
