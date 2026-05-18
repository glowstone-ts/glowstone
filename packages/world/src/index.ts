import { BlockPos, ChunkPos } from "@dripleaf/core"
import { type BlockData, stateToBlock } from "@dripleaf/block"
import type { EntityData } from "@dripleaf/entity"
import { ChunkData, type ChunkKey, type HeightmapType, chunkKey } from "@dripleaf/chunk"
import { DimensionType, DimensionTypeRegistry, WorldgenBiome, WorldgenBiomeRegistry } from "@dripleaf/registry"

export {
  ChunkData,
  ChunkSection,
  SECTION_COUNT,
  SECTION_SIZE,
  BIOME_COUNT,
  OVERWORLD_CHUNK_CONFIG,
  MIN_SECTION_Y,
  createHeightmapSet,
  applyLevelChunk,
  chunkKey,
  compactData,
  createBiomePalette,
  createLinearPalette,
  createSingletonPalette,
  indexToPos,
  parseChunkKey,
  parseHeightmaps,
  parseChunkSections,
  posToIndex,
  swappedLongs,
  uncompactData,
  type ChunkDimensionConfig,
  type ChunkHeightmapEntry,
  type ChunkKey,
  type HeightmapSet,
  type HeightmapType,
  type Palette,
  type PaletteType,
} from "@dripleaf/chunk"
export { DimensionType, DimensionTypeRegistry, WorldgenBiome, WorldgenBiomeRegistry }

export type Dimension = {
  type: DimensionType
  identifier: string
}

export type FindBlocksOptions = {
  min?: BlockPos
  max?: BlockPos
  maxDistance?: number
  limit?: number
  origin?: BlockPos
}

export interface FindBlocksPredicate {
  (block: BlockData): boolean
}

export class World {
  dimension: Dimension
  chunks: Map<ChunkKey, ChunkData>
  entities: Map<number, EntityData>
  cache: CachedWorld

  constructor(dimension: Dimension) {
    this.dimension = dimension
    this.chunks = new Map()
    this.entities = new Map()
    this.cache = new CachedWorld(this)
  }

  getBlock(pos: BlockPos): BlockData | undefined {
    const chunk = this.getChunkForBlock(pos)
    if (!chunk) return undefined
    const state = chunk.getBlock(pos)
    if (state === undefined) return undefined
    return stateToBlock(state)
  }

  getBlockState(pos: BlockPos): number | undefined {
    return this.getChunkForBlock(pos)?.getBlock(pos)
  }

  setBlock(pos: BlockPos, state: number): void {
    const chunkX = Math.floor(pos.x / 16)
    const chunkZ = Math.floor(pos.z / 16)
    const key = chunkKey(chunkX, chunkZ)
    let chunk = this.chunks.get(key)
    if (!chunk) {
      chunk = new ChunkData(chunkX, chunkZ)
      this.chunks.set(key, chunk)
    }
    chunk.setBlock(pos, state)
    this.cache.invalidateBlock(pos)
  }

  addEntity(entity: EntityData): void {
    this.entities.set(entity.id, entity)
  }

  removeEntity(id: number): void {
    this.entities.delete(id)
  }

  getChunk(pos: ChunkPos): ChunkData | undefined {
    return this.chunks.get(chunkKey(pos.x, pos.z))
  }

  getChunkForBlock(pos: BlockPos): ChunkData | undefined {
    const chunkX = Math.floor(pos.x / 16)
    const chunkZ = Math.floor(pos.z / 16)
    return this.chunks.get(chunkKey(chunkX, chunkZ))
  }

  getBiome(pos: BlockPos): number | undefined {
    return this.getChunkForBlock(pos)?.getBiome(pos)
  }

  forgetChunk(x: number, z: number): void {
    this.chunks.delete(chunkKey(x, z))
    this.cache.invalidateChunk(x, z)
  }

  clear(): void {
    this.chunks.clear()
    this.cache.clear()
  }

  getHeight(type: HeightmapType, x: number, z: number): number | undefined {
    const chunkX = Math.floor(x / 16)
    const chunkZ = Math.floor(z / 16)
    return this.chunks.get(chunkKey(chunkX, chunkZ))?.getHeight(type, x, z)
  }

  findBlocks(predicate: FindBlocksPredicate, options: FindBlocksOptions = {}): BlockPos[] {
    const result: BlockPos[] = []
    const limit = options.limit ?? Number.POSITIVE_INFINITY
    const min = options.min
    const max = options.max
    const maxDistanceSq = options.maxDistance === undefined
      ? Number.POSITIVE_INFINITY
      : options.maxDistance * options.maxDistance

    for (const chunk of this.chunks.values()) {
      const baseX = chunk.x * 16
      const baseZ = chunk.z * 16
      for (const section of chunk.sections) {
        if (!section) continue
        const paletteIds = section.palette.getIds()
        if (paletteIds.length > 0 && !paletteIds.some((id) => {
          const block = stateToBlock(id)
          return block ? predicate(block) : false
        })) continue
        const baseY = section.y * 16
        for (let y = 0; y < 16; y++) {
          const worldY = baseY + y
          if ((min && worldY < min.y) || (max && worldY > max.y)) continue
          for (let z = 0; z < 16; z++) {
            const worldZ = baseZ + z
            if ((min && worldZ < min.z) || (max && worldZ > max.z)) continue
            for (let x = 0; x < 16; x++) {
              const worldX = baseX + x
              if ((min && worldX < min.x) || (max && worldX > max.x)) continue
              if (options.origin) {
                const dx = worldX - options.origin.x
                const dy = worldY - options.origin.y
                const dz = worldZ - options.origin.z
                if ((dx * dx) + (dy * dy) + (dz * dz) > maxDistanceSq) continue
              }
              const pos = new BlockPos(worldX, worldY, worldZ)
              const state = section.getBlock(x, y, z)
              const block = stateToBlock(state)
              if (!block || !predicate(block)) continue
              result.push(pos)
            }
          }
        }
      }
    }

    if (options.origin) {
      const origin = options.origin
      result.sort((a, b) => distanceSq(a, origin) - distanceSq(b, origin))
    }
    return result.slice(0, limit)
  }
}

export class CachedWorld {
  readonly #source: { getBlockState(pos: BlockPos): number | undefined }
  readonly #blocks = new Map<string, number | undefined>()

  constructor(source: { getBlockState(pos: BlockPos): number | undefined }) {
    this.#source = source
  }

  getBlockState(pos: BlockPos): number {
    const key = blockKey(pos)
    if (!this.#blocks.has(key))
      this.#blocks.set(key, this.#source.getBlockState(pos) ?? 0)
    return this.#blocks.get(key) ?? 0
  }

  getBlock(pos: BlockPos): BlockData | undefined {
    return stateToBlock(this.getBlockState(pos))
  }

  invalidateBlock(pos: BlockPos): void {
    this.#blocks.delete(blockKey(pos))
  }

  invalidateChunk(x: number, z: number): void {
    const prefix = `${x},${z},`
    for (const key of this.#blocks.keys()) {
      if (key.startsWith(prefix))
        this.#blocks.delete(key)
    }
  }

  invalidateSection(x: number, z: number): void {
    this.invalidateChunk(x, z)
  }

  clear(): void {
    this.#blocks.clear()
  }
}

function blockKey(pos: BlockPos): string {
  return `${Math.floor(pos.x / 16)},${Math.floor(pos.z / 16)},${pos.x},${pos.y},${pos.z}`
}

function distanceSq(a: BlockPos, b: BlockPos): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return (dx * dx) + (dy * dy) + (dz * dz)
}
