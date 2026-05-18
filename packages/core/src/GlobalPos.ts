import { Identifier } from "@dripleaf/registry"
import { BlockPos } from "./BlockPos"

export class GlobalPos {
  constructor(
    public dimension: Identifier,
    public pos: BlockPos
  ) {}
}
