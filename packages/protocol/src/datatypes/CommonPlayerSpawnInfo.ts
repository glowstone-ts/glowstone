import { Identifier } from "@dripleaf/registry";
import { codec, type PacketReader, type PacketWriter } from "../buffer";
import type { GameType } from "./GameType";
import { GlobalPos } from "./GlobalPos";

export class CommonPlayerSpawnInfo {
  static readonly codec = codec<CommonPlayerSpawnInfo>({
    encode(writer: PacketWriter, value: CommonPlayerSpawnInfo) {
      writer.writeVarInt(value.dimensionType);
      writer.writeIdentifier(value.dimension);
      writer.writeLong(value.seed);
      writer.writeByte(value.gameType);
      writer.writeByte(value.previousGameType !== null ? value.previousGameType : -1);
      writer.writeBoolean(value.isDebug);
      writer.writeBoolean(value.isFlat);
      writer.writePrefixedOptional(value.lastDeathLocation, location => writer.writeCodec(GlobalPos.codec, location));
      writer.writeVarInt(value.portalCooldown);
      writer.writeVarInt(value.seaLevel);
    },
    decode(reader: PacketReader): CommonPlayerSpawnInfo {
      const dimensionType = reader.readVarInt();
      const dimension = reader.readIdentifier();
      const seed = reader.readLong();
      const gameType = reader.readByte() as GameType;
      const previousGameTypeByte = reader.readByte();
      const previousGameType = previousGameTypeByte !== -1 ? (previousGameTypeByte as GameType) : null;
      const isDebug = reader.readBoolean();
      const isFlat = reader.readBoolean();
      const lastDeathLocation = reader.readPrefixedOptional(() => reader.readCodec(GlobalPos.codec));
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
        seaLevel,
      );
    },
  });

  constructor(
    public dimensionType: number, // todo: dimension type id from registry
    public dimension: Identifier,
    public seed: bigint,
    public gameType: GameType,
    public previousGameType: GameType | null,
    public isDebug: boolean,
    public isFlat: boolean,
    public lastDeathLocation: GlobalPos | null,
    public portalCooldown: number,
    public seaLevel: number
  ) {}
}
