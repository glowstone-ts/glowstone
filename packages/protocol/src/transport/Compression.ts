import { deflateSync, inflateSync } from "node:zlib";
import { PacketReader, PacketWriter } from "../buffer";

const MAX_UNCOMPRESSED_LENGTH = 8388608;

export function encodePacketFrame(packetBody: Uint8Array, compressionThreshold = -1): Uint8Array {
  const payload = compressionThreshold >= 0
    ? encodeCompressedBody(packetBody, compressionThreshold)
    : packetBody;

  const frameWriter = new PacketWriter();
  frameWriter.writeVarInt(payload.length);
  frameWriter.writeBytes(payload);
  return frameWriter.finish();
}

export function decodePacketBody(framePayload: Uint8Array, compressionThreshold = -1): Uint8Array {
  if (compressionThreshold < 0)
    return framePayload;

  const reader = new PacketReader(framePayload);
  const uncompressedLength = reader.readVarInt();
  const compressedBytes = reader.readRemaining();

  if (uncompressedLength === 0)
    return compressedBytes;

  if (uncompressedLength < compressionThreshold)
    throw new Error(`Compressed packet below threshold: ${uncompressedLength} < ${compressionThreshold}`);

  if (uncompressedLength > MAX_UNCOMPRESSED_LENGTH)
    throw new Error(`Decompressed packet too large: ${uncompressedLength} > ${MAX_UNCOMPRESSED_LENGTH}`);

  const packetBody = inflateSync(compressedBytes);
  if (packetBody.length !== uncompressedLength)
    throw new Error(`Invalid decompressed packet length: expected ${uncompressedLength}, got ${packetBody.length}`);

  return packetBody;
}

function encodeCompressedBody(packetBody: Uint8Array, compressionThreshold: number): Uint8Array {
  const writer = new PacketWriter();

  if (packetBody.length < compressionThreshold) {
    writer.writeVarInt(0);
    writer.writeBytes(packetBody);
    return writer.finish();
  }

  const compressed = deflateSync(packetBody);
  writer.writeVarInt(packetBody.length);
  writer.writeBytes(compressed);
  return writer.finish();
}
