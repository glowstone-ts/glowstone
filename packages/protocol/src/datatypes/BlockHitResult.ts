import { Direction } from "../types"
import { codec, Codecs } from "../buffer"
import { BlockPos } from "./BlockPos"
import type { Vec3 } from "vec3"

export class BlockHitResult {
	static readonly codec = codec(BlockHitResult, {
    miss: Codecs.bool,
    location: Codecs.vec3d,
    direction: Codecs.varIntEnum(Direction),
    blockPos: BlockPos.codec,
    inside: Codecs.bool,
    worldBorderHit: Codecs.bool,
	})
  
	constructor(
		public miss: boolean,
		public location: Vec3,
		public direction: Direction,
		public blockPos: BlockPos,
		public inside: boolean,
		public worldBorderHit: boolean,
	) {}
}