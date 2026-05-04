import { codec, type Codec, type StructCodecShape } from "../buffer";

export abstract class DripleafPacket {}

export type PacketCodec<T extends DripleafPacket> = Codec<T>;

export function packetCodec<T extends DripleafPacket>(value: PacketCodec<T>): PacketCodec<T>;
export function packetCodec<T extends DripleafPacket>(type: new (...args: any[]) => T, shape: StructCodecShape<T>): PacketCodec<T>;
export function packetCodec<T extends DripleafPacket>(
  typeOrValue: PacketCodec<T> | (new (...args: any[]) => T),
  shape?: StructCodecShape<T>,
): PacketCodec<T> {
  if (shape)
    return codec(typeOrValue as new (...args: any[]) => T, shape);
  return codec(typeOrValue as PacketCodec<T>);
}
