import { RelativeMovements } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"

export const RelativeMovementsCodec = codec<RelativeMovements>({
  encode(writer: PacketWriter, value: RelativeMovements) {
    writer.writeInt(value.pack())
  },
  decode(reader: PacketReader): RelativeMovements {
    return RelativeMovements.unpack(reader.readInt())
  },
})
