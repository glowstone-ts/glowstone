import { RespawnData, GlobalPos } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"
import { GlobalPosCodec } from "./GlobalPos"

export const RespawnDataCodec = codec<RespawnData>({
  encode(writer: PacketWriter, value: RespawnData) {
    writer.writeCodec(GlobalPosCodec, value.globalPos)
    writer.writeFloat(value.yaw)
    writer.writeFloat(value.pitch)
  },
  decode(reader: PacketReader): RespawnData {
    const globalPos = reader.readCodec(GlobalPosCodec)
    const yaw = reader.readFloat()
    const pitch = reader.readFloat()
    return new RespawnData(globalPos, yaw, pitch)
  },
})
