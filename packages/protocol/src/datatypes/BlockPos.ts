import { BlockPos } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"

export const BlockPosCodec = codec<BlockPos>({
  encode(writer: PacketWriter, value: BlockPos) {
    const packed = value.pack()
    for (let shift = 56n; shift >= 0n; shift -= 8n)
      writer.writeUnsignedByte(Number((packed >> shift) & 0xffn))
  },
  decode(reader: PacketReader): BlockPos {
    return BlockPos.unpack(reader.readLong())
  },
})
