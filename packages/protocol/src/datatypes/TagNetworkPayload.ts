import type { TagNetworkPayload } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"

export const TagNetworkPayloadCodec = codec<TagNetworkPayload>({
  encode(writer: PacketWriter, value: TagNetworkPayload) {
    writer.writeVarInt(value.size)
    for (const [tag, ids] of value) {
      writer.writeString(tag)
      writer.writeVarInt(ids.length)
      for (const id of ids)
        writer.writeVarInt(id)
    }
  },
  decode(reader: PacketReader): TagNetworkPayload {
    const size = reader.readVarInt()
    const value = new Map<string, number[]>()
    for (let index = 0; index < size; index++) {
      const tag = reader.readString()
      const idCount = reader.readVarInt()
      const ids: number[] = []
      for (let idIndex = 0; idIndex < idCount; idIndex++)
        ids.push(reader.readVarInt())
      value.set(tag, ids)
    }
    return value
  },
})
