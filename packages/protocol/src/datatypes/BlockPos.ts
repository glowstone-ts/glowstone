import { BlockPos } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"

export const BlockPosCodec = codec<BlockPos>({
  encode(writer: PacketWriter, value: BlockPos) {
    writer.writeLong(value.pack())
  },
  decode(reader: PacketReader): BlockPos {
    return BlockPos.unpack(reader.readLong())
  },
})
