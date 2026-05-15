import type { Connection } from "@dripleaf/protocol"
import type { GameProfile } from "@dripleaf/core"
import type { World } from "@dripleaf/world"
import type { EntityData } from "@dripleaf/entity"
import type { Window, ItemStack } from "@dripleaf/inventory"
import type { RegistryManager } from "@dripleaf/registry"
import type { EventEmitter } from "node:events"

export type EquipmentEntry = {
  slot: number
  item: ItemStack
}

export type ClientContext = {
  username: string
  connection: Connection | null
  profile: GameProfile | null
  loggedIn: boolean
  entityId: number
  position: { x: number; y: number; z: number }
  yaw: number
  pitch: number
  onGround: boolean
  health: number
  food: number
  saturation: number
  world: World | null
  entities: Map<number, EntityData>
  inventory: Window
  heldItem: number
  sequence: number
  equipment: Map<number, EquipmentEntry[]>
  registries: RegistryManager
  chunkBatchSize: number
  emitter: EventEmitter
  emit(event: string, ...args: unknown[]): void
}
