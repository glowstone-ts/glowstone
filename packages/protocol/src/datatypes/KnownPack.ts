import type { PacketReader, PacketWriter } from "../buffer";

export class KnownPack {
  constructor(
    public namespace: string | null,
    public id: string,
    public version: string,
  ) {}

  write(writer: PacketWriter) {
    writer.writeString(this.namespace ?? "minecraft");
    writer.writeString(this.id);
    writer.writeString(this.version);
  }

  static read(reader: PacketReader): KnownPack {
    const namespace = reader.readString();
    const id = reader.readString();
    const version = reader.readString();
    return new KnownPack(namespace, id, version);
  }
}