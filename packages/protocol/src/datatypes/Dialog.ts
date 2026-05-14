import type { Dialog } from "@dripleaf/core"
import type { NbtTag } from "@dripleaf/nbt"
import { Codecs, type PacketReader, type PacketWriter } from "../buffer"

export type { Dialog }

export const dialogCodec = {
  encode(writer: PacketWriter, value: Dialog) {
    writer.writeNbt(value as unknown as Omit<NbtTag, "name">)
  },
  decode(reader: PacketReader): Dialog {
    return reader.readNbt() as unknown as Dialog
  },
}

export const dialogHolderCodec = Codecs.holderEither(Codecs.string(32767), dialogCodec)
