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

function getMaxStackSize(item: ItemStack | ItemStackData): number {
  if ("type" in item && item.type === "empty") return 64
  return 64
}

export function simulateClick(window: Window, slot: number, button: number, clickType: ClickType): ClickResult | null {
  switch (clickType) {
    case ClickType.Pickup:
      return simulatePickupClick(window, slot, button)
    case ClickType.QuickMove:
      return simulateQuickMoveClick(window, slot)
    case ClickType.Swap:
      return simulateSwapClick(window, slot, button)
    case ClickType.Clone:
      return simulateCloneClick(window, slot)
    case ClickType.Throw:
      return simulateThrowClick(window, slot, button)
    case ClickType.PickupAll:
      return simulatePickupAllClick(window, slot)
    default:
      return null
  }
}

export function simulatePickupClick(window: Window, slot: number, button = 0): ClickResult | null {
  const cursor = cloneStack(window.getSlot(-1))
  const target = cloneStack(window.getSlot(slot))
  const changed = new Map<number, ItemStack>()

  if (slot === OUTSIDE_SLOT) {
    if (button === 0 && cursor.type === "present") {
      window.setSlot(-1, ItemStack.Empty)
      changed.set(-1, ItemStack.Empty)
      return { changedSlots: changed, carriedItem: ItemStack.Empty }
    }
    if (button === 1 && cursor.type === "present") {
      const one = cursor.item.split(1)
      window.setSlot(-1, cursor.item.count > 0 ? ItemStack.Present(cursor.item) : ItemStack.Empty)
      changed.set(-1, window.getSlot(-1))
      return { changedSlots: changed, carriedItem: window.getSlot(-1) }
    }
    return null
  }

  if (button === 1) {
    if (cursor.type === "empty" && target.type === "present") {
      const half = Math.ceil(target.item.count / 2)
      const left = target.item.split(half)
      window.setSlot(-1, ItemStack.Present(left))
      window.setSlot(slot, target.item.count > 0 ? ItemStack.Present(target.item) : ItemStack.Empty)
      changed.set(slot, window.getSlot(slot))
      changed.set(-1, window.getSlot(-1))
      return { changedSlots: changed, carriedItem: window.getSlot(-1) }
    }
    if (cursor.type === "present" && target.type === "empty") {
      const one = cursor.item.split(1)
      window.setSlot(slot, ItemStack.Present(one))
      window.setSlot(-1, cursor.item.count > 0 ? ItemStack.Present(cursor.item) : ItemStack.Empty)
      changed.set(slot, window.getSlot(slot))
      changed.set(-1, window.getSlot(-1))
      return { changedSlots: changed, carriedItem: window.getSlot(-1) }
    }
    if (cursor.type === "present" && target.type === "present" && cursor.item.isSameItemAndComponents(target.item)) {
      if (target.item.count < getMaxStackSize(target.item)) {
        window.setSlot(slot, ItemStack.Present(new ItemStackData(target.item.kind, target.item.count + 1, { ...target.item.component_patch })))
        const newCursor = cursor.item.count > 1 ? ItemStack.Present(new ItemStackData(cursor.item.kind, cursor.item.count - 1, { ...cursor.item.component_patch })) : ItemStack.Empty
        window.setSlot(-1, newCursor)
        changed.set(slot, window.getSlot(slot))
        changed.set(-1, window.getSlot(-1))
        return { changedSlots: changed, carriedItem: window.getSlot(-1) }
      }
      return null
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
      const max = getMaxStackSize(target.item)
      const space = max - target.item.count
      if (space <= 0) return null
      const move = Math.min(space, cursor.item.count)
      target.item.count += move
      cursor.item.count -= move
      window.setSlot(slot, ItemStack.Present(target.item))
      window.setSlot(-1, cursor.item.count > 0 ? ItemStack.Present(cursor.item) : ItemStack.Empty)
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

function simulateQuickMoveClick(window: Window, slot: number): ClickResult | null {
  const itemStack = cloneStack(window.getSlot(slot))
  if (itemStack.type === "empty") return null
  const item = itemStack.item

  const changed = new Map<number, ItemStack>()
  const isPlayerInventory = window.type === "inventory"
  const containerSlots = isPlayerInventory ? 9 : window.slots.size - 36
  const playerSlotsStart = containerSlots
  const hotbarStart = containerSlots + 27

  let targetStart: number
  let targetEnd: number

  if (slot < playerSlotsStart) {
    targetStart = playerSlotsStart
    targetEnd = hotbarStart + 9
  } else if (slot < hotbarStart) {
    targetStart = hotbarStart
    targetEnd = hotbarStart + 9
    if (!moveItemToSlots(window, item, targetStart, targetEnd)) {
      targetStart = playerSlotsStart
      targetEnd = hotbarStart
      moveItemToSlots(window, item, targetStart, targetEnd)
    }
  } else {
    targetStart = playerSlotsStart
    targetEnd = hotbarStart
    if (!moveItemToSlots(window, item, targetStart, targetEnd)) {
      targetStart = hotbarStart
      targetEnd = hotbarStart + 9
      moveItemToSlots(window, item, targetStart, targetEnd)
    }
  }

  if (item.count > 0) {
    window.setSlot(slot, ItemStack.Present(item))
  } else {
    window.setSlot(slot, ItemStack.Empty)
  }
  changed.set(slot, window.getSlot(slot))
  changed.set(-1, window.getSlot(-1))

  for (let i = targetStart; i < targetEnd; i++) {
    changed.set(i, window.getSlot(i))
  }

  return { changedSlots: changed, carriedItem: window.getSlot(-1) }
}

function moveItemToSlots(window: Window, item: ItemStackData, start: number, end: number): boolean {
  for (let i = start; i < end; i++) {
    const slotItem = window.getSlot(i)
    if (slotItem.type === "present" && slotItem.item.isSameItemAndComponents(item) && slotItem.item.count < getMaxStackSize(slotItem)) {
      const space = getMaxStackSize(slotItem) - slotItem.item.count
      const move = Math.min(space, item.count)
      slotItem.item.count += move
      item.count -= move
      window.setSlot(i, ItemStack.Present(slotItem.item))
      if (item.count <= 0) return true
    }
  }
  for (let i = start; i < end; i++) {
    const slotItem = window.getSlot(i)
    if (slotItem.type === "empty") {
      window.setSlot(i, ItemStack.Present(new ItemStackData(item.kind, item.count, { ...item.component_patch })))
      item.count = 0
      return true
    }
  }
  return item.count <= 0
}

function simulateSwapClick(window: Window, slot: number, hotbarSlot: number): ClickResult | null {
  if (slot === OUTSIDE_SLOT) return null
  const targetItem = cloneStack(window.getSlot(slot))
  const hotbarItem = cloneStack(window.getSlot(hotbarSlot))
  const changed = new Map<number, ItemStack>()

  if (targetItem.type === "empty" && hotbarItem.type === "empty") return null

  window.setSlot(slot, hotbarItem)
  window.setSlot(hotbarSlot, targetItem)
  changed.set(slot, window.getSlot(slot))
  changed.set(hotbarSlot, window.getSlot(hotbarSlot))
  return { changedSlots: changed, carriedItem: window.getSlot(-1) }
}

function simulateCloneClick(window: Window, slot: number): ClickResult | null {
  const cursor = window.getSlot(-1)
  const target = window.getSlot(slot)
  if (cursor.type !== "empty" || target.type === "empty") return null

  const changed = new Map<number, ItemStack>()
  const clone = ItemStack.Present(new ItemStackData(target.item.kind, getMaxStackSize(target.item), { ...target.item.component_patch }))
  window.setSlot(-1, clone)
  changed.set(-1, window.getSlot(-1))
  return { changedSlots: changed, carriedItem: window.getSlot(-1) }
}

function simulateThrowClick(window: Window, slot: number, button: number): ClickResult | null {
  const cursor = window.getSlot(-1)
  if (cursor.type !== "empty" || slot === OUTSIDE_SLOT) return null
  const target = window.getSlot(slot)
  if (target.type === "empty") return null

  const changed = new Map<number, ItemStack>()
  if (button === 0) {
    if (target.item.count <= 1) {
      window.setSlot(slot, ItemStack.Empty)
    } else {
      target.item.count -= 1
      window.setSlot(slot, ItemStack.Present(target.item))
    }
  } else {
    window.setSlot(slot, ItemStack.Empty)
  }
  changed.set(slot, window.getSlot(slot))
  return { changedSlots: changed, carriedItem: window.getSlot(-1) }
}

function simulatePickupAllClick(window: Window, slot: number): ClickResult | null {
  const cursorStack = cloneStack(window.getSlot(-1))
  if (cursorStack.type === "empty") return null
  const cursor = cursorStack.item

  const changed = new Map<number, ItemStack>()
  let remaining = getMaxStackSize(cursor) - cursor.count
  if (remaining <= 0) return null

  for (const [i, slotData] of window.slots) {
    if (i === slot || i === -1) continue
    const item = slotData.item
    if (item.type === "present" && item.item.isSameItemAndComponents(cursor) && remaining > 0) {
      const move = Math.min(remaining, item.item.count)
      cursor.count += move
      item.item.count -= move
      remaining -= move
      if (item.item.count <= 0) {
        window.setSlot(i, ItemStack.Empty)
      } else {
        window.setSlot(i, ItemStack.Present(item.item))
      }
      changed.set(i, window.getSlot(i))
    }
  }

  window.setSlot(-1, ItemStack.Present(cursor))
  changed.set(-1, window.getSlot(-1))
  return { changedSlots: changed, carriedItem: window.getSlot(-1) }
}
