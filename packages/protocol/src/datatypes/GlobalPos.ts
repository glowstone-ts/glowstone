import type { Vec3 } from "vec3";
import type { PacketReader } from "../buffer/PacketReader";
import type { PacketWriter } from "../buffer/PacketWriter";

export class GlobalPos {
  constructor(
    public dimension: string, // todo: registry resource key 
    public pos: Vec3
  ) {}

  write(writer: PacketWriter) {
    writer.writeString(this.dimension);
    writer.writeBlockPos(this.pos);
  }

  static read(reader: PacketReader): GlobalPos {
    const dimension = reader.readString();
    const pos = reader.readBlockPos();
    return new GlobalPos(dimension, pos);
  }
}