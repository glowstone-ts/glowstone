import { CommonPlayerSpawnInfo, GameType, GlobalPos } from "@dripleaf/core"
import { DimensionType } from "@dripleaf/registry"
import { codec, Codecs, type PacketReader, type PacketWriter } from "../buffer"
import { GlobalPosCodec } from "./GlobalPos"

const dimensionTypeCodec = {
  encode(w: PacketWriter, v: DimensionType) {
    const values = Object.keys(DimensionType).filter(k => Number.isNaN(Number(k))).map(k => DimensionType[k as keyof typeof DimensionType]) as DimensionType[]
    const idx = values.indexOf(v)
    if (idx < 0) throw new Error(`Unknown DimensionType: ${v}`)
    w.writeVarInt(idx)
  },
  decode(r: PacketReader): DimensionType {
    const id = r.readVarInt()
    const values = Object.keys(DimensionType).filter(k => Number.isNaN(Number(k))).map(k => DimensionType[k as keyof typeof DimensionType]) as DimensionType[]
    return values[id]!
  },
}

export const CommonPlayerSpawnInfoCodec = codec(CommonPlayerSpawnInfo, {
  dimensionType: dimensionTypeCodec,
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
