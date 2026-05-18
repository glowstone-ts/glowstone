import type { Vec3 } from "vec3"
import { BlockPos } from "./BlockPos"

export enum Direction {
  Down = 0,
  Up = 1,
  North = 2,
  South = 3,
  West = 4,
  East = 5,
}

export class BlockHitResult {
  constructor(
    public miss: boolean,
    public location: Vec3,
    public direction: Direction,
    public blockPos: BlockPos,
    public inside: boolean,
    public worldBorderHit: boolean,
  ) {}
}
