import { codec, type PacketReader, type PacketWriter } from "../buffer";
import { GlobalPos } from "./GlobalPos";

export class RespawnData {
  static readonly codec = codec<RespawnData>({
    encode(writer: PacketWriter, value: RespawnData) {
      writer.writeCodec(GlobalPos.codec, value.globalPos);
      writer.writeFloat(value.yaw);
      writer.writeFloat(value.pitch);
    },
    decode(reader: PacketReader): RespawnData {
      const globalPos = reader.readCodec(GlobalPos.codec);
      const yaw = reader.readFloat();
      const pitch = reader.readFloat();
      return new RespawnData(globalPos, yaw, pitch);
    },
  });

  constructor(
    public globalPos: GlobalPos,
    public yaw: number,
    public pitch: number
  ) {}
}
