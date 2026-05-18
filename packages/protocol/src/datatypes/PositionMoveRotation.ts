import { PositionMoveRotation } from "@dripleaf/core"
import { codec, type PacketReader, type PacketWriter } from "../buffer"
import type { Vec3 } from "vec3"

export const PositionMoveRotationCodec = codec<PositionMoveRotation>({
  encode(writer: PacketWriter, value: PositionMoveRotation) {
    writer.writeVec3d(value.position)
    writer.writeVec3d(value.deltaMovement)
    writer.writeFloat(value.yaw)
    writer.writeFloat(value.pitch)
  },
  decode(reader: PacketReader): PositionMoveRotation {
    const position = reader.readVec3d()
    const deltaMovement = reader.readVec3d()
    const yaw = reader.readFloat()
    const pitch = reader.readFloat()
    return new PositionMoveRotation(position, deltaMovement, yaw, pitch)
  },
})
