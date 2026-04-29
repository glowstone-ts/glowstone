import type { PacketReader, PacketWriter } from "../buffer";
import { GlobalPos } from "./GlobalPos";

export class RespawnData {
  constructor(
    public globalPos: GlobalPos,
    public yaw: number,
    public pitch: number
  ) {}

  write(writer: PacketWriter) {
    writer.writeString(this.globalPos.dimension);
    writer.writeBlockPos(this.globalPos.pos);
    writer.writeFloat(this.yaw);
    writer.writeFloat(this.pitch);
  }

  static read(reader: PacketReader): RespawnData {
    const dimension = reader.readString();
    const position = reader.readBlockPos();
    const yaw = reader.readFloat();
    const pitch = reader.readFloat();
    return new RespawnData(new GlobalPos(dimension, position), yaw, pitch);
  }
}