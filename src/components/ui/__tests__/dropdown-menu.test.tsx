import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"

type RootPropsCapture = {
  modal?: boolean
}

let latestRootProps: RootPropsCapture | null = null

jest.mock("lucide-react", () => ({
  Check: () => null,
  ChevronRight: () => null,
  Circle: () => null,
}))

jest.mock("@radix-ui/react-dropdown-menu", () => {
  const React = require("react")

  const Root = ({ children, ...props }: React.PropsWithChildren<RootPropsCapture>) => {
    latestRootProps = props
    return <div data-testid="dropdown-root">{children}</div>
  }

  const Trigger = React.forwardRef(function Trigger(
    { children, ...props }: React.ComponentPropsWithoutRef<"button">,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) {
    return (
      <button ref={ref} type="button" {...props}>
        {children}
      </button>
    )
  })

  const Content = React.forwardRef(function Content(
    { children, ...props }: React.ComponentPropsWithoutRef<"div">,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  })

  type SelectEvent = {
    defaultPrevented: boolean
    preventDefault: () => void
  }

  type ItemProps = React.ComponentPropsWithoutRef<"button"> & {
    onSelect?: (event: SelectEvent) => void
  }

  const Item = React.forwardRef(function Item(
    { children, onSelect, ...props }: ItemProps,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => {
          const event: SelectEvent = {
            defaultPrevented: false,
            preventDefault() {
              event.defaultPrevented = true
            },
          }

          onSelect?.(event)
        }}
        {...props}
      >
        {children}
      </button>
    )
  })

  const Label = React.forwardRef(function Label(
    { children, ...props }: React.ComponentPropsWithoutRef<"div">,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  })

  const Separator = React.forwardRef(function Separator(
    props: React.ComponentPropsWithoutRef<"div">,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return <div ref={ref} {...props} />
  })

  const passthrough = ({ children }: React.PropsWithChildren) => <>{children}</>

  return {
    Root,
    Trigger,
    Group: passthrough,
    Portal: passthrough,
    Sub: passthrough,
    RadioGroup: passthrough,
    SubTrigger: Trigger,
    SubContent: Content,
    Content,
    Item,
    CheckboxItem: Item,
    RadioItem: Item,
    Label,
    Separator,
    ItemIndicator: passthrough,
  }
})

import { DropdownMenu, DropdownMenuActionItem } from "@/components/ui/dropdown-menu"

describe("DropdownMenu shared wrapper", () => {
  beforeEach(() => {
    latestRootProps = null
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it("defaults DropdownMenu to non-modal mode", () => {
    render(
      <DropdownMenu>
        <div>Menu</div>
      </DropdownMenu>,
    )

    expect(latestRootProps?.modal).toBe(false)
  })

  it("defers action item callbacks until the next tick", () => {
    const onSelectAction = jest.fn()

    render(
      <DropdownMenuActionItem onSelectAction={onSelectAction}>
        Open dialog
      </DropdownMenuActionItem>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }))

    expect(onSelectAction).not.toHaveBeenCalled()

    act(() => {
      jest.runAllTimers()
    })

    expect(onSelectAction).toHaveBeenCalledTimes(1)
  })

  it("does not run deferred action if the menu select event was prevented", () => {
    const onSelectAction = jest.fn()

    render(
      <DropdownMenuActionItem
        onSelect={(event) => event.preventDefault()}
        onSelectAction={onSelectAction}
      >
        Prevented action
      </DropdownMenuActionItem>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Prevented action" }))

    act(() => {
      jest.runAllTimers()
    })

    expect(onSelectAction).not.toHaveBeenCalled()
  })
})
