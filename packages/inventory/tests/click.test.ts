import { describe, expect, test } from "bun:test"
import { ItemType } from "@dripleaf/registry"
import { ItemStack, Window, simulatePickupClick } from "../src/index"

describe("simulatePickupClick", () => {
  test("picks up stack from slot to cursor", () => {
    const window = new Window(0, "inventory", "inv", 10)
    window.setSlot(3, ItemStack.new(ItemType.Stone, 4))
    const result = simulatePickupClick(window, 3, 0)
    expect(result).not.toBeNull()
    expect(window.getSlot(3).type).toBe("empty")
    expect(window.getSlot(-1).type).toBe("present")
  })
})
