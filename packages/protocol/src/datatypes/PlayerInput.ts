import { PlayerInput } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"

export const PlayerInputCodec = codec<PlayerInput>({
  encode(writer: PacketWriter, value: PlayerInput) {
    writer.writeByte(value.packFlags())
  },
  decode(reader: PacketReader): PlayerInput {
    return PlayerInput.unpackFlags(reader.readByte())
  },
})
