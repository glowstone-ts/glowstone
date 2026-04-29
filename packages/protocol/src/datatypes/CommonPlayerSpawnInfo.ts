import type { GameType } from "./GameType";
import { GlobalPos } from "./GlobalPos";
import type { PacketReader } from "../buffer/PacketReader";
import type { PacketWriter } from "../buffer/PacketWriter";

export class CommonPlayerSpawnInfo {
  constructor(
    public dimensionType: number, // todo: dimension type id from registry
    public dimension: string, // todo: resource key
    public seed: bigint,
    public gameType: GameType,
    public previousGameType: GameType | null,
    public isDebug: boolean,
    public isFlat: boolean,
    public lastDeathLocation: GlobalPos | null,
    public portalCooldown: number,
    public seaLevel: number
  ) {}

  write(writer: PacketWriter) {
    writer.writeVarInt(this.dimensionType);
    writer.writeString(this.dimension);
    writer.writeLong(this.seed);
    writer.writeByte(this.gameType);
    writer.writeByte(this.previousGameType !== null ? this.previousGameType : -1);
    writer.writeBoolean(this.isDebug);
    writer.writeBoolean(this.isFlat);
    writer.writePrefixedOptional(this.lastDeathLocation, (location) => {
      writer.writeString(location.dimension);
      writer.writeBlockPos(location.pos);
    });
    writer.writeVarInt(this.portalCooldown);
    writer.writeVarInt(this.seaLevel);
  }
  
  static read(reader: PacketReader): CommonPlayerSpawnInfo {
    const dimensionType = reader.readVarInt();
    const dimension = reader.readString();
    const seed = reader.readLong();
    const gameType = reader.readByte() as GameType;
    const previousGameTypeByte = reader.readByte();
    const previousGameType = previousGameTypeByte !== -1 ? (previousGameTypeByte as GameType) : null;
    const isDebug = reader.readBoolean();
    const isFlat = reader.readBoolean();
    const lastDeathLocation = reader.readPrefixedOptional(() => {
      const dimension = reader.readString();
      const position = reader.readBlockPos();
      return new GlobalPos(dimension, position);
    });
    const portalCooldown = reader.readVarInt();
    const seaLevel = reader.readVarInt();

    return new CommonPlayerSpawnInfo(
      dimensionType,
      dimension,
      seed,
      gameType,
      previousGameType,
      isDebug,
      isFlat,
      lastDeathLocation,
      portalCooldown,
      seaLevel
    );
  }
}