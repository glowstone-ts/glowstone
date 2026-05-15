import { EntityType, ItemType } from "@dripleaf/registry"
import { PacketReader, PacketWriter, Codecs } from "../../protocol/src/buffer/index.ts"
import { BlockPos, GlobalPos } from "@dripleaf/core"

export { EntityType, EntityTypeRegistry } from "@dripleaf/registry"

export class Vec3 {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}
}

export enum MetadataType {
  Byte = 0,
  VarInt = 1,
  VarLong = 2,
  Float = 3,
  String = 4,
  Chat = 5,
  OptionalChat = 6,
  Slot = 7,
  Boolean = 8,
  Rotations = 9,
  Position = 10,
  OptionalPosition = 11,
  Direction = 12,
  OptionalUUID = 13,
  BlockState = 14,
  OptionalBlockState = 15,
  Nbt = 16,
  Particle = 17,
  VillagerData = 18,
  OptionalVarInt = 19,
  Pose = 20,
  CatVariant = 21,
  WolfVariant = 22,
  FrogVariant = 23,
  OptionalGlobalPos = 24,
  PaintingVariant = 25,
  SnifferState = 30,
  ArmadilloState = 31,
  Vector3 = 32,
  Quaternion = 33,
}

export type MetadataEntry = {
  index: number
  type: MetadataType
  value: unknown
}

export type ItemSlot = {
  itemCount: number
  itemId: ItemType
  components: Record<string, unknown>
} | null

export type AttributeModifier = {
  uuid: string
  name: string
  amount: number
  operation: number
}

export type EntityAttribute = {
  key: string
  value: number
  modifiers: AttributeModifier[]
}

export class EntityData {
  constructor(
    public id: number,
    public uuid: string,
    public type: EntityType,
    public position: Vec3,
    public yaw: number,
    public pitch: number,
    public headYaw: number,
    public velocity: { x: number; y: number; z: number },
    public metadata: Map<number, MetadataEntry>,
  ) {}
}

export function decodeMetadata(reader: PacketReader): Map<number, MetadataEntry> {
  const metadata = new Map<number, MetadataEntry>()

  while (reader.remaining > 0) {
    const index = reader.readUnsignedByte()

    if (index === 0xff) break

    const type = reader.readVarInt() as MetadataType
    const value = readMetadataValue(reader, type)

    metadata.set(index, { index, type, value })
  }

  return metadata
}

function readMetadataValue(reader: PacketReader, type: MetadataType): unknown {
  switch (type) {
    case MetadataType.Byte:
      return reader.readUnsignedByte()

    case MetadataType.VarInt:
      return reader.readVarInt()

    case MetadataType.VarLong:
      return reader.readVarLong()

    case MetadataType.Float:
      return reader.readFloat()

    case MetadataType.String:
      return reader.readString(32767)

    case MetadataType.Chat:
      return reader.readNbt()

    case MetadataType.OptionalChat:
      return reader.readOptionalNbt()

    case MetadataType.Slot: {
      const count = reader.readVarInt()
      if (count <= 0) return null
      const itemId = Codecs.varIntEnum(ItemType).decode(reader) as ItemType
      const components = readDataComponentPatch(reader)
      return { itemCount: count, itemId, components } as ItemSlot
    }

    case MetadataType.Boolean:
      return reader.readBoolean()

    case MetadataType.Rotations:
      return [reader.readFloat(), reader.readFloat(), reader.readFloat()] as [number, number, number]

    case MetadataType.Position:
      return BlockPos.unpack(reader.readLong())

    case MetadataType.OptionalPosition: {
      const present = reader.readBoolean()
      return present ? BlockPos.unpack(reader.readLong()) : null
    }

    case MetadataType.Direction:
      return reader.readVarInt()

    case MetadataType.OptionalUUID: {
      const present = reader.readBoolean()
      return present ? reader.readUUID() : null
    }

    case MetadataType.BlockState:
      return reader.readVarInt()

    case MetadataType.OptionalBlockState: {
      const state = reader.readVarInt()
      return state === -1 ? null : state
    }

    case MetadataType.Nbt:
      return reader.readNbt()

    case MetadataType.Particle: {
      const particleId = reader.readVarInt()
      return { id: particleId }
    }

    case MetadataType.VillagerData:
      return [reader.readVarInt(), reader.readVarInt(), reader.readVarInt()] as [number, number, number]

    case MetadataType.OptionalVarInt: {
      const value = reader.readVarInt()
      return value === 0 ? null : value
    }

    case MetadataType.Pose:
      return reader.readVarInt()

    case MetadataType.CatVariant:
      return reader.readVarInt()

    case MetadataType.WolfVariant:
      return reader.readVarInt()

    case MetadataType.FrogVariant:
      return reader.readVarInt()

    case MetadataType.OptionalGlobalPos: {
      const present = reader.readBoolean()
      if (!present) return null
      const dimension = reader.readIdentifier()
      const pos = BlockPos.unpack(reader.readLong())
      return new GlobalPos(dimension, pos)
    }

    case MetadataType.PaintingVariant:
      return reader.readVarInt()

    case MetadataType.SnifferState:
      return reader.readVarInt()

    case MetadataType.ArmadilloState:
      return reader.readVarInt()

    case MetadataType.Vector3:
      return new Vec3(reader.readFloat(), reader.readFloat(), reader.readFloat())

    case MetadataType.Quaternion:
      return [reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat()] as [number, number, number, number]

    default:
      throw new Error(`Unknown metadata type: ${type}`)
  }
}

export function encodeMetadata(writer: PacketWriter, metadata: Map<number, MetadataEntry>): void {
  for (const [index, entry] of metadata) {
    writer.writeUnsignedByte(index)
    writer.writeVarInt(entry.type)
    writeMetadataValue(writer, entry)
  }

  writer.writeUnsignedByte(0xff)
}

function writeMetadataValue(writer: PacketWriter, entry: MetadataEntry): void {
  const { type, value } = entry

  switch (type) {
    case MetadataType.Byte:
      writer.writeUnsignedByte(value as number)
      break

    case MetadataType.VarInt:
      writer.writeVarInt(value as number)
      break

    case MetadataType.VarLong:
      writer.writeVarLong(value as bigint)
      break

    case MetadataType.Float:
      writer.writeFloat(value as number)
      break

    case MetadataType.String:
      writer.writeString(value as string)
      break

    case MetadataType.Chat:
      writer.writeNbt(value as any)
      break

    case MetadataType.OptionalChat:
      writer.writeOptionalNbt(value as any)
      break

    case MetadataType.Slot: {
      const slot = value as ItemSlot
      if (slot == null) {
        writer.writeVarInt(0)
      } else {
        writer.writeVarInt(slot.itemCount)
        Codecs.varIntEnum(ItemType).encode(writer, slot.itemId)
        writeDataComponentPatch(writer, slot.components)
      }
      break
    }

    case MetadataType.Boolean:
      writer.writeBoolean(value as boolean)
      break

    case MetadataType.Rotations: {
      const [x, y, z] = value as [number, number, number]
      writer.writeFloat(x)
      writer.writeFloat(y)
      writer.writeFloat(z)
      break
    }

    case MetadataType.Position:
      writer.writeLong((value as BlockPos).pack())
      break

    case MetadataType.OptionalPosition: {
      const pos = value as BlockPos | null
      writer.writeBoolean(pos != null)
      if (pos != null) writer.writeLong(pos.pack())
      break
    }

    case MetadataType.Direction:
      writer.writeVarInt(value as number)
      break

    case MetadataType.OptionalUUID: {
      const uuid = value as string | null
      writer.writeBoolean(uuid != null)
      if (uuid != null) writer.writeUUID(uuid)
      break
    }

    case MetadataType.BlockState:
      writer.writeVarInt(value as number)
      break

    case MetadataType.OptionalBlockState: {
      const state = value as number | null
      writer.writeVarInt(state ?? -1)
      break
    }

    case MetadataType.Nbt:
      writer.writeNbt(value as any)
      break

    case MetadataType.Particle: {
      const particle = value as { id: number }
      writer.writeVarInt(particle.id)
      break
    }

    case MetadataType.VillagerData: {
      const [type_, profession, level] = value as [number, number, number]
      writer.writeVarInt(type_)
      writer.writeVarInt(profession)
      writer.writeVarInt(level)
      break
    }

    case MetadataType.OptionalVarInt: {
      const val = value as number | null
      writer.writeVarInt(val ?? 0)
      break
    }

    case MetadataType.Pose:
      writer.writeVarInt(value as number)
      break

    case MetadataType.CatVariant:
      writer.writeVarInt(value as number)
      break

    case MetadataType.WolfVariant:
      writer.writeVarInt(value as number)
      break

    case MetadataType.FrogVariant:
      writer.writeVarInt(value as number)
      break

    case MetadataType.OptionalGlobalPos: {
      const globalPos = value as GlobalPos | null
      writer.writeBoolean(globalPos != null)
      if (globalPos != null) {
        writer.writeIdentifier(globalPos.dimension)
        writer.writeLong(globalPos.pos.pack())
      }
      break
    }

    case MetadataType.PaintingVariant:
      writer.writeVarInt(value as number)
      break

    case MetadataType.SnifferState:
      writer.writeVarInt(value as number)
      break

    case MetadataType.ArmadilloState:
      writer.writeVarInt(value as number)
      break

    case MetadataType.Vector3: {
      const vec = value as Vec3
      writer.writeFloat(vec.x)
      writer.writeFloat(vec.y)
      writer.writeFloat(vec.z)
      break
    }

    case MetadataType.Quaternion: {
      const [x, y, z, w] = value as [number, number, number, number]
      writer.writeFloat(x)
      writer.writeFloat(y)
      writer.writeFloat(z)
      writer.writeFloat(w)
      break
    }

    default:
      throw new Error(`Unknown metadata type: ${type}`)
  }
}

function readDataComponentPatch(reader: PacketReader): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const positiveCount = reader.readVarInt()
  const negativeCount = reader.readVarInt()

  for (let i = 0; i < positiveCount; i++) {
    const type = Codecs.varIntEnum(ItemType).decode(reader) as string
    const nbt = reader.readNbt()
    patch[type] = nbtValueToPlain(nbt.value)
  }

  for (let i = 0; i < negativeCount; i++) {
    const type = Codecs.varIntEnum(ItemType).decode(reader) as string
    patch[type] = null
  }

  return patch
}

function writeDataComponentPatch(writer: PacketWriter, patch: Record<string, unknown>): void {
  const entries = Object.entries(patch)
  const positive = entries.filter(([, v]) => v !== null && v !== undefined)
  const negative = entries.filter(([, v]) => v === null || v === undefined)

  writer.writeVarInt(positive.length)
  writer.writeVarInt(negative.length)

  for (const [key, val] of positive) {
    Codecs.varIntEnum(ItemType).encode(writer, key as any)
    writer.writeNbt({
      type: 10,
      value: plainToNbtValue(val),
    } as any)
  }

  for (const [key] of negative) {
    Codecs.varIntEnum(ItemType).encode(writer, key as any)
  }
}

function nbtValueToPlain(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "string") return value
  if (value instanceof Uint8Array) return Array.from(value)
  if (Array.isArray(value)) return value.map(nbtValueToPlain)
  if (typeof value === "object" && "elementType" in value && "items" in value)
    return (value as any).items.map(nbtValueToPlain)
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>))
    result[k] = nbtValueToPlain(v)
  return result
}

function plainToNbtValue(value: unknown): unknown {
  if (value === null || value === undefined) return 0
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "string") return value
  if (typeof value === "boolean") return value ? 1 : 0
  if (Array.isArray(value)) return value.map(plainToNbtValue)
  if (typeof value === "object") {
    const compound: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>))
      compound[k] = plainToNbtValue(v)
    return compound
  }
  return String(value)
}
