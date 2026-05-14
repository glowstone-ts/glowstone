import { CommonPlayerSpawnInfo, GameType, GlobalPos } from "@dripleaf/core"
import { DimensionType } from "@dripleaf/registry"
import { codec, Codecs, type PacketReader, type PacketWriter } from "../buffer"
import { GlobalPosCodec } from "./GlobalPos"

export const CommonPlayerSpawnInfoCodec = codec(CommonPlayerSpawnInfo, {
  dimensionType: Codecs.varIntEnum(DimensionType),
  dimension: Codecs.identifier,
  seed: Codecs.long,
  gameType: Codecs.byteEnum(GameType),
  previousGameType: codec<GameType | null>({
    encode(writer: PacketWriter, value: GameType | null) {
      writer.writeByte(value !== null ? value : -1)
    },
    decode(reader: PacketReader): GameType | null {
      const byte = reader.readByte()
      return byte !== -1 ? (byte as GameType) : null
    },
  }),
  isDebug: Codecs.bool,
  isFlat: Codecs.bool,
  lastDeathLocation: Codecs.prefixedOptional(GlobalPosCodec),
  portalCooldown: Codecs.varInt,
  seaLevel: Codecs.varInt,
})
