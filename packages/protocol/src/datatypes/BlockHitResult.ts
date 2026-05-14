import { BlockHitResult, Direction, BlockPos } from "@dripleaf/core"
import { codec, Codecs } from "../buffer"
import type { Vec3 } from "vec3"
import { BlockPosCodec } from "./BlockPos"

export const BlockHitResultCodec = codec(BlockHitResult, {
  miss: Codecs.bool,
  location: Codecs.vec3d,
  direction: Codecs.varIntEnum(Direction),
  blockPos: BlockPosCodec,
  inside: Codecs.bool,
  worldBorderHit: Codecs.bool,
})
