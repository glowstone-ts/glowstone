import { BlockType } from "@dripleaf/registry"
import { BlockPos } from "@dripleaf/core"

export type BlockLike = {
  type: BlockType | string
  properties: Record<string, string | boolean | number>
}

export type BlockClassification = {
  passable: boolean
  solid: boolean
  standable: boolean
  water: boolean
}

const DANGEROUS_BLOCKS = new Set([
  BlockType.Lava,
  BlockType.Fire,
  BlockType.SoulFire,
  BlockType.SweetBerryBush,
  BlockType.PowderSnow,
])

export function classifyBlock(block: BlockLike | undefined): BlockClassification {
  if (!block) return { passable: false, solid: false, standable: false, water: false }

  const { type, properties: p } = block
  const typeName = String(type)
  const shortName = typeName.includes(":") ? typeName.split(":")[1]! : typeName

  if (type === BlockType.Air || shortName === "air" || shortName === "void_air" || shortName === "cave_air")
    return { passable: true, solid: false, standable: false, water: false }

  const water = type === BlockType.Water || shortName === "water" || p.waterlogged === true
  const dangerous = DANGEROUS_BLOCKS.has(type as BlockType)

  const slab = p.type === "top" || p.type === "bottom" || p.type === "double"
  const stair = shortName.endsWith("_stairs")
  const nonFull = shortName.includes("slab") || shortName.endsWith("_carpet") || shortName === "snow"
  const passableBlock = shortName.endsWith("_fence") || shortName.endsWith("_bars") || shortName.endsWith("_pane") || shortName.endsWith("_door")

  const fullCube = !slab && !stair && !nonFull && !passableBlock && !water && !dangerous

  const passable = !fullCube && !water && !dangerous
  const solid = (fullCube || p.type === "top" || p.type === "double") && type !== BlockType.MagmaBlock
  const standable = solid || slab || stair

  return { passable, solid, standable, water }
}

export type PhysicsWorld = {
  getBlock(pos: BlockPos): BlockLike | undefined
}

export function isPassableAt(world: PhysicsWorld, pos: BlockPos): boolean {
  const feet = classifyBlock(world.getBlock(pos))
  const head = classifyBlock(world.getBlock(new BlockPos(pos.x, pos.y + 1, pos.z)))
  return feet.passable && head.passable
}

export function isStandableAt(world: PhysicsWorld, pos: BlockPos): boolean {
  const below = classifyBlock(world.getBlock(new BlockPos(pos.x, pos.y - 1, pos.z)))
  return below.standable && isPassableAt(world, pos)
}
