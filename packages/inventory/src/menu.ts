import { MenuType } from "@dripleaf/registry"
import type { WindowType } from "./Window"

export function menuTypeToWindowType(menu: MenuType): WindowType {
  switch (menu) {
    case MenuType.Crafting: return "crafting_table"
    case MenuType.Furnace: return "furnace"
    case MenuType.BlastFurnace: return "blast_furnace"
    case MenuType.Smoker: return "smoker"
    case MenuType.BrewingStand: return "brewing_stand"
    case MenuType.Enchantment: return "enchantment_table"
    case MenuType.Anvil: return "anvil"
    case MenuType.Grindstone: return "grindstone"
    case MenuType.CartographyTable: return "cartography_table"
    case MenuType.Stonecutter: return "stonecutter"
    case MenuType.Loom: return "loom"
    case MenuType.Hopper: return "hopper"
    case MenuType.ShulkerBox: return "shulker_box"
    case MenuType.Merchant: return "merchant"
    case MenuType.Beacon: return "beacon"
    case MenuType.Lectern: return "lectern"
    case MenuType.Smithing: return "smithing_table"
    default: return "chest"
  }
}

export function menuSlotCount(menu: MenuType): number {
  switch (menu) {
    case MenuType.Generic9x1: return 9
    case MenuType.Generic9x2: return 18
    case MenuType.Generic9x3: return 27
    case MenuType.Generic9x4: return 36
    case MenuType.Generic9x5: return 45
    case MenuType.Generic9x6: return 54
    case MenuType.Generic3x3: return 9
    case MenuType.Crafter3x3: return 9
    case MenuType.Hopper: return 5
    case MenuType.BrewingStand: return 5
    case MenuType.Furnace:
    case MenuType.BlastFurnace:
    case MenuType.Smoker: return 3
    case MenuType.Enchantment: return 2
    case MenuType.Anvil: return 3
    case MenuType.Beacon: return 1
    case MenuType.Grindstone: return 3
    case MenuType.CartographyTable: return 3
    case MenuType.Stonecutter: return 2
    case MenuType.Loom: return 4
    case MenuType.Merchant: return 7
    case MenuType.Lectern: return 1
    case MenuType.ShulkerBox: return 27
    case MenuType.Smithing: return 4
    case MenuType.Crafting: return 10
    default: return 27
  }
}
