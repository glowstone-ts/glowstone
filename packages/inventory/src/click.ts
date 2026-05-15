import { ItemStack, ItemStackData } from "./ItemStack"
import type { Window } from "./Window"

export enum ClickType {
  Pickup = 0,
  QuickMove = 1,
  Swap = 2,
  Clone = 3,
  Throw = 4,
  QuickCraft = 5,
  PickupAll = 6,
}

export const OUTSIDE_SLOT = -999

export type ClickResult = {
  changedSlots: Map<number, ItemStack>
  carriedItem: ItemStack
}

function cloneStack(stack: ItemStack): ItemStack {
  if (stack.type === "empty") return ItemStack.Empty
  return ItemStack.Present(new ItemStackData(stack.item.kind, stack.item.count, { ...stack.item.component_patch }))
}

export function simulatePickupClick(window: Window, slot: number, button = 0): ClickResult | null {
  const cursor = cloneStack(window.getSlot(-1))
  const target = cloneStack(window.getSlot(slot))
  const changed = new Map<number, ItemStack>()

  if (button === 1) {
    if (cursor.type === "empty" && target.type === "present") {
      const half = Math.ceil(target.item.count / 2)
      const left = target.item.split(half)
      window.setSlot(-1, ItemStack.Present(left))
      window.setSlot(slot, ItemStack.Present(target.item))
      changed.set(slot, window.getSlot(slot))
      changed.set(-1, window.getSlot(-1))
      return { changedSlots: changed, carriedItem: window.getSlot(-1) }
    }
    if (cursor.type === "present" && target.type === "empty") {
      const one = cursor.item.split(1)
      window.setSlot(slot, ItemStack.Present(one))
      window.setSlot(-1, ItemStack.Present(cursor.item))
      changed.set(slot, window.getSlot(slot))
      changed.set(-1, window.getSlot(-1))
      return { changedSlots: changed, carriedItem: window.getSlot(-1) }
    }
    return null
  }

  if (cursor.type === "empty" && target.type === "present") {
    window.setSlot(-1, target)
    window.setSlot(slot, ItemStack.Empty)
    changed.set(slot, ItemStack.Empty)
    changed.set(-1, window.getSlot(-1))
    return { changedSlots: changed, carriedItem: window.getSlot(-1) }
  }

  if (cursor.type === "present" && target.type === "empty") {
    window.setSlot(slot, cursor)
    window.setSlot(-1, ItemStack.Empty)
    changed.set(slot, window.getSlot(slot))
    changed.set(-1, ItemStack.Empty)
    return { changedSlots: changed, carriedItem: ItemStack.Empty }
  }

  if (cursor.type === "present" && target.type === "present") {
    if (cursor.item.isSameItemAndComponents(target.item)) {
      const max = 64
      const space = max - target.item.count
      if (space <= 0) return null
      const move = Math.min(space, cursor.item.count)
      target.item.count += move
      cursor.item.count -= move
      window.setSlot(slot, ItemStack.Present(target.item))
      window.setSlot(-1, ItemStack.Present(cursor.item))
    } else {
      window.setSlot(slot, cursor)
      window.setSlot(-1, target)
    }
    changed.set(slot, window.getSlot(slot))
    changed.set(-1, window.getSlot(-1))
    return { changedSlots: changed, carriedItem: window.getSlot(-1) }
  }

  return null
}
