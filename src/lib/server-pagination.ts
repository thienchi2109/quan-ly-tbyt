export const DEFAULT_SERVER_PAGE_SIZE = 50

export type ServerPaginationPage<T> = {
  items: T[]
  nextPage: number | null
}

export function getServerPaginationRange(
  pageParam: number,
  pageSize = DEFAULT_SERVER_PAGE_SIZE,
) {
  const from = pageParam * pageSize

  return {
    from,
    to: from + pageSize,
  }
}

export function toServerPaginationPage<T>(
  fetchedItems: T[],
  pageParam: number,
  pageSize = DEFAULT_SERVER_PAGE_SIZE,
): ServerPaginationPage<T> {
  const hasNextPage = fetchedItems.length > pageSize

  return {
    items: fetchedItems.slice(0, pageSize),
    nextPage: hasNextPage ? pageParam + 1 : null,
  }
}

export function getNextServerPageParam<T>(lastPage: ServerPaginationPage<T>) {
  return lastPage.nextPage ?? undefined
}

export function flattenServerPages<T>(
  data: { pages: Array<ServerPaginationPage<T>> } | undefined,
) {
  return data?.pages.flatMap((page) => page.items) ?? []
}
