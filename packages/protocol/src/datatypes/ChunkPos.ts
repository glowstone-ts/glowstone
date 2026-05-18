import { ChunkPos } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"

export const ChunkPosCodec = codec<ChunkPos>({
  encode(writer: PacketWriter, value: ChunkPos) {
    writer.writeLong(value.pack())
  },
  decode(reader: PacketReader): ChunkPos {
    const packed = reader.readLong()
    return ChunkPos.unpack(packed)
  },
})
