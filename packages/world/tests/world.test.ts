import { describe, expect, test } from "bun:test"
import { BlockPos, ChunkPos } from "@dripleaf/core"
import { DimensionType } from "@dripleaf/registry"
import { CachedWorld, ChunkSection, World, createSingletonPalette } from "../src/index"

describe("World", () => {
  test("getBiome reads from section biome palette", () => {
    const section = new ChunkSection(0)
    section.biomePalette = createSingletonPalette(7)
    section.biomes = new Uint8Array(0)
    expect(section.getBiome(0, 0, 0)).toBe(7)
  })

  test("World.getBiome returns biome from loaded chunk", () => {
    const world = new World({ type: DimensionType.Overworld, identifier: "minecraft:overworld" })
    const pos = new BlockPos(0, 64, 0)
    world.setBlock(pos, 1)
    const chunk = world.getChunk(new ChunkPos(0, 0))!
    const sectionIndex = Math.floor(64 / 16) - (-4)
    const section = chunk.sections[sectionIndex]!
    section.biomePalette = createSingletonPalette(42)
    section.biomes = new Uint8Array(0)
    expect(world.getBiome(pos)).toBe(42)
  })

  test("forgetChunk removes chunk data", () => {
    const world = new World({ type: DimensionType.Overworld, identifier: "minecraft:overworld" })
    world.setBlock(new BlockPos(0, 64, 0), 1)
    world.forgetChunk(0, 0)
    expect(world.getBlock(new BlockPos(0, 64, 0))).toBeUndefined()
  })

  test("getHeight returns heightmap values from loaded chunk", () => {
    const world = new World({ type: DimensionType.Overworld, identifier: "minecraft:overworld" })
    world.setBlock(new BlockPos(0, 64, 0), 1)
    expect(world.getHeight("WORLD_SURFACE", 0, 0)).toBe(64)
  })

  test("findBlocks scans loaded chunks with bounds and limit", () => {
    const world = new World({ type: DimensionType.Overworld, identifier: "minecraft:overworld" })
    world.setBlock(new BlockPos(0, 64, 0), 1)
    world.setBlock(new BlockPos(1, 64, 0), 2)

    expect(world.findBlocks((block) => block.stateId > 0, {
      min: new BlockPos(0, 64, 0),
      max: new BlockPos(0, 64, 0),
      limit: 1,
    })).toEqual([new BlockPos(0, 64, 0)])
  })

  test("findBlocks honors maxDistance and nearest-first origin ordering", () => {
    const world = new World({ type: DimensionType.Overworld, identifier: "minecraft:overworld" })
    world.setBlock(new BlockPos(10, 64, 0), 1)
    world.setBlock(new BlockPos(1, 64, 0), 1)
    world.setBlock(new BlockPos(3, 64, 0), 1)

    expect(world.findBlocks((block) => block.stateId === 1, {
      origin: new BlockPos(0, 64, 0),
      maxDistance: 4,
    })).toEqual([
      new BlockPos(1, 64, 0),
      new BlockPos(3, 64, 0),
    ])
  })

  test("CachedWorld invalidates blocks and chunks", () => {
    const world = new World({ type: DimensionType.Overworld, identifier: "minecraft:overworld" })
    const cache = new CachedWorld(world)
    const pos = new BlockPos(0, 64, 0)
    world.setBlock(pos, 1)
    expect(cache.getBlockState(pos)).toBe(1)

    world.setBlock(pos, 2)
    expect(cache.getBlockState(pos)).toBe(1)
    cache.invalidateBlock(pos)
    expect(cache.getBlockState(pos)).toBe(2)

    world.setBlock(new BlockPos(1, 64, 0), 3)
    expect(cache.getBlockState(new BlockPos(1, 64, 0))).toBe(3)
    world.forgetChunk(0, 0)
    cache.invalidateChunk(0, 0)
    expect(cache.getBlockState(new BlockPos(1, 64, 0))).toBe(0)
  })
})
