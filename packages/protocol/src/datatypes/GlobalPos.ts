import { Identifier } from "@dripleaf/registry";
import { Codecs, codec } from "../buffer";
import { BlockPos } from "./BlockPos";

export class GlobalPos {
	static readonly codec = codec(GlobalPos, {
		dimension: Codecs.identifier,
		pos: BlockPos.codec,
	});

  constructor(
    public dimension: Identifier,
    public pos: BlockPos
  ) {}
}