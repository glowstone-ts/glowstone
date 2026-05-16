import type { ChatComponent } from "@dripleaf/chat"
import { toNbt, fromNbt } from "@dripleaf/chat"
import type { Codec } from "../buffer"

export const ChatComponentCodec: Codec<ChatComponent> = {
  encode(writer, value) {
    writer.writeNbt(toNbt(value))
  },
  decode(reader) {
    return fromNbt(reader.readNbt())
  },
}
