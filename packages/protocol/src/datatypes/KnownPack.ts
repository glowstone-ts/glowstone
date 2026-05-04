import { codec, type PacketReader, type PacketWriter } from "../buffer";

export class KnownPack {
  static readonly codec = codec<KnownPack>({
    encode(writer: PacketWriter, value: KnownPack) {
      writer.writeString(value.namespace ?? "minecraft");
      writer.writeString(value.id);
      writer.writeString(value.version);
    },
    decode(reader: PacketReader): KnownPack {
      const namespace = reader.readString();
      const id = reader.readString();
      const version = reader.readString();
      return new KnownPack(namespace, id, version);
    },
  });

  constructor(
    public namespace: string | null,
    public id: string,
    public version: string,
  ) {}
}
