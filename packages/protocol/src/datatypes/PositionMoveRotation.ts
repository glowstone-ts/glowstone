import type { Vec3 } from "vec3";
import type { PacketReader, PacketWriter } from "../buffer";

export class PositionMoveRotation {
  constructor(
    public position: Vec3,
    public deltaMovement: Vec3,
    public yaw: number,
    public pitch: number
  ) {}

  write(writer: PacketWriter) {
    writer.writeVec3d(this.position);
    writer.writeVec3d(this.deltaMovement);
    writer.writeFloat(this.yaw);
    writer.writeFloat(this.pitch);
  }

  static read(reader: PacketReader): PositionMoveRotation {
    const position = reader.readVec3d();
    const deltaMovement = reader.readVec3d();
    const yaw = reader.readFloat();
    const pitch = reader.readFloat();
    return new PositionMoveRotation(position, deltaMovement, yaw, pitch);
  }
}