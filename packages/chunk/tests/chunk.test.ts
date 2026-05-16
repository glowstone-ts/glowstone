import { describe, expect, test } from "bun:test"
import { BlockPos } from "@dripleaf/core"
import {
  ChunkData,
  ChunkSection,
  chunkKey,
  createHeightmapSet,
  createSingletonPalette,
  parseChunkKey,
  type ChunkDimensionConfig,
} from "../src/index"

describe("ChunkData", () => {
  test("chunk keys do not collide and parse round-trips", () => {
    const first = chunkKey(1, 0)
    const second = chunkKey(0, 31)
    expect(first).not.toBe(second)
    expect(parseChunkKey(first)).toEqual({ x: 1, z: 0 })
    expect(parseChunkKey(chunkKey(-12, 34))).toEqual({ x: -12, z: 34 })
  })

  test("stores block states in sections", () => {
    const chunk = new ChunkData(0, 0)
    chunk.setBlock(new BlockPos(1, 64, 2), 5)
    expect(chunk.getBlock(new BlockPos(1, 64, 2))).toBe(5)
  })

  test("respects configured min-y and max-y bounds", () => {
    const config: ChunkDimensionConfig = {
      minY: -16,
      height: 32,
      sectionCount: 2,
      minSectionY: -1,
    }
    const chunk = new ChunkData(0, 0, config)
    chunk.setBlock(new BlockPos(0, -16, 0), 5)
    chunk.setBlock(new BlockPos(0, 15, 0), 6)
    chunk.setBlock(new BlockPos(0, -17, 0), 7)
    chunk.setBlock(new BlockPos(0, 16, 0), 8)

    expect(chunk.getBlock(new BlockPos(0, -16, 0))).toBe(5)
    expect(chunk.getBlock(new BlockPos(0, 15, 0))).toBe(6)
    expect(chunk.getBlock(new BlockPos(0, -17, 0))).toBeUndefined()
    expect(chunk.getBlock(new BlockPos(0, 16, 0))).toBeUndefined()
  })

  test("queries and updates heightmaps", () => {
    const chunk = new ChunkData(0, 0, undefined, createHeightmapSet({
      WORLD_SURFACE: new Array(256).fill(64),
    }))
    expect(chunk.getHeight("WORLD_SURFACE", 0, 0)).toBe(64)

    chunk.setBlock(new BlockPos(0, 70, 0), 5)
    expect(chunk.getHeight("WORLD_SURFACE", 0, 0)).toBe(70)

    chunk.setBlock(new BlockPos(0, 70, 0), 0)
    expect(chunk.getHeight("WORLD_SURFACE", 0, 0)).toBeUndefined()
  })

  test("reads singleton biome palette", () => {
    const section = new ChunkSection(0)
    section.biomePalette = createSingletonPalette(7)
    section.biomes = new Uint8Array(0)
    expect(section.getBiome(0, 0, 0)).toBe(7)
  })
})
