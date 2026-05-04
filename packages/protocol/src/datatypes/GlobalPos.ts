import { Identifier } from "@dripleaf/registry";
import { codec, type PacketReader, type PacketWriter } from "../buffer";
import type { Vec3 } from "vec3";

export class GlobalPos {
  static readonly codec = codec<GlobalPos>({
    encode(writer: PacketWriter, value: GlobalPos) {
      writer.writeIdentifier(value.dimension);
      writer.writeBlockPos(value.pos);
    },
    decode(reader: PacketReader): GlobalPos {
      const dimension = reader.readIdentifier();
      const pos = reader.readBlockPos();
      return new GlobalPos(dimension, pos);
    },
  });

  constructor(
    public dimension: Identifier,
    public pos: Vec3
  ) {}
}
