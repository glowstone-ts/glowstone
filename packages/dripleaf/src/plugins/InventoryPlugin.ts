import * as play from "@dripleaf/protocol"
import type { ItemStack } from "@dripleaf/inventory"
import type { ClientContext, EquipmentEntry } from "../context"
import type { ClientPlugin } from "./types"

export class InventoryPlugin implements ClientPlugin {
  readonly name = "inventory"

  register(ctx: ClientContext, conn: import("@dripleaf/protocol").Connection): void {
    conn.onPacket(play.ClientboundContainerSetContentPacket, (packet) => {
      if (packet.windowId !== 0) return
      ctx.inventory.state = packet.stateId
      for (let i = 0; i < packet.slots.length; i++)
        ctx.inventory.setSlot(i, packet.slots[i]!)
      ctx.inventory.setSlot(-1, packet.carriedItem)
    })

    conn.onPacket(play.ClientboundContainerSetSlotPacket, (packet) => {
      if (packet.windowId !== 0) return
      ctx.inventory.state = packet.stateId
      ctx.inventory.setSlot(packet.slot, packet.slotData)
    })

    conn.onPacket(play.ClientboundSetPlayerInventoryPacket, (packet) => {
      if (packet.slot === -1) {
        ctx.inventory.setSlot(-1, packet.contents as ItemStack)
        return
      }
      ctx.inventory.setSlot(packet.slot, packet.contents as ItemStack)
    })

    conn.onPacket(play.ClientboundSetCursorItemPacket, (packet) => {
      ctx.inventory.setSlot(-1, packet.contents)
    })

    conn.onPacket(play.ClientboundSetEquipmentPacket, (packet) => {
      ctx.equipment.set(packet.entityId, packet.slots as EquipmentEntry[])
    })

    conn.onPacket(play.ClientboundSetHeldSlotPacket, (packet) => {
      ctx.heldItem = packet.slot
      ctx.emit("heldItemChange", packet.slot)
    })

    conn.onPacket(play.ClientboundPlayerInfoUpdatePacket, (packet) => {
      for (const entry of packet.entries) {
        if (!entry.chatSession) continue
        conn.write(new play.ServerboundChatSessionUpdatePacket({
          sessionId: entry.chatSession.uuid,
          publicKey: {
            expiresAt: { seconds: entry.chatSession.publicKey.expireTime, nanos: 0 },
            key: entry.chatSession.publicKey.keyBytes,
            keySignature: entry.chatSession.publicKey.keySignature,
          },
        }))
      }
    })
  }
}
