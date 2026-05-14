import { KnownPack } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"

export const KnownPackCodec = codec<KnownPack>({
  encode(writer: PacketWriter, value: KnownPack) {
    writer.writeString(value.namespace ?? "minecraft")
    writer.writeString(value.id)
    writer.writeString(value.version)
  },
  decode(reader: PacketReader): KnownPack {
    const namespace = reader.readString()
    const id = reader.readString()
    const version = reader.readString()
    return new KnownPack(namespace, id, version)
  },
})
