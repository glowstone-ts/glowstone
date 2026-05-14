import { GlobalPos, BlockPos } from "@dripleaf/core"
import { codec, Codecs } from "../buffer"
import { BlockPosCodec } from "./BlockPos"

export const GlobalPosCodec = codec(GlobalPos, {
  dimension: Codecs.identifier,
  pos: BlockPosCodec,
})
