import type { SoundEventValue } from "@dripleaf/core"
import { Codecs } from "../buffer"

export type { SoundEventValue }

const directSoundEventCodec = {
  encode(writer: any, value: SoundEventValue) {
    Codecs.identifier.encode(writer, value.location)
    writer.writePrefixedOptional(value.fixedRange, (range: number) => writer.writeFloat(range))
  },
  decode(reader: any): SoundEventValue {
    return {
      location: Codecs.identifier.decode(reader) as any,
      fixedRange: reader.readPrefixedOptional(() => reader.readFloat()),
    }
  },
}

export const soundHolderCodec = Codecs.holderEither(Codecs.string(32767), directSoundEventCodec)
