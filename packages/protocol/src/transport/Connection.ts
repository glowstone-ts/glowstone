// This file was inspired by https://github.com/janispritzkau/mcproto so yeah shoutout!!
import { EventEmitter } from "node:events";
import type { Socket } from "node:net";
import type TypedEmitter from "typed-emitter";
import { concatBytes, PacketReader, PacketWriter, toUint8Array } from "../buffer";
import { tryDecodeVarInt } from "../buffer/varint";
import { ClientboundLoginCompressionPacket } from "../packets/login";
import type { DripleafPacket } from "../packets/DripleafPacket";
import { packetRegistry } from "../packets";
import { Direction, State } from "../types";
import { decodePacketBody, encodePacketFrame } from "./Compression";
import type { PacketConstructor } from "../registry/PacketRegistry";

type PacketListener<T extends DripleafPacket> = (packet: T) => void;

type Events = {
  packet: (packet: DripleafPacket) => void;
  compressionThreshold: (threshold: number) => void;
  state: (state: State) => void;
  error: (error: Error) => void;
  end: () => void;
};

export class Connection extends (EventEmitter as new () => TypedEmitter<Events>) {
  state = State.Handshake;
  compressionThreshold = -1;

  private readonly incomingDirection: Direction;
  private buffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  private readonly packetListeners = new Map<PacketConstructor, Set<PacketListener<DripleafPacket>>>();

  constructor(
    public readonly socket: Socket,
    isServer: boolean,
  ) {
    super();
    this.incomingDirection = isServer ? Direction.Serverbound : Direction.Clientbound;

    this.socket.setNoDelay(true);
    this.socket.on("data", (chunk: Uint8Array) => this.handleData(toUint8Array(chunk)));
    this.socket.on("error", error => this.emit("error", error));
    this.socket.on("end", () => this.emit("end"));
    this.socket.on("close", () => this.emit("end"));
  }

  write(packet: DripleafPacket): void {
    const bodyWriter = new PacketWriter();
    bodyWriter.writeVarInt(packet.id);
    packet.write(bodyWriter);
    const frame = encodePacketFrame(bodyWriter.finish(), this.compressionThreshold);
    this.socket.write(frame);
  }

  onPacket<T extends DripleafPacket>(packetType: PacketConstructor<T>, listener: PacketListener<T>) {
    const listeners = this.packetListeners.get(packetType) ?? new Set();
    listeners.add(listener as PacketListener<DripleafPacket>);
    this.packetListeners.set(packetType, listeners);

    listeners.delete(listener as PacketListener<DripleafPacket>);
    if (listeners.size === 0)
      this.packetListeners.delete(packetType);
    
    return;
  }

  setState(state: State) {
    this.state = state;
    this.emit("state", state);
  }

  setCompressionThreshold(threshold: number | null) {
    this.compressionThreshold = threshold ?? -1;
    this.emit("compressionThreshold", this.compressionThreshold);
  }

  disconnect() {
    this.socket.end();
  }

  private handleData(chunk: Uint8Array) {
    this.buffer = concatBytes(this.buffer, chunk);

    try {
      for (;;) {
        const frame = this.tryReadFrame();
        if (!frame)
          return;

        const packet = this.decodePacket(frame);
        this.emit("packet", packet);
        this.packetListeners.get(packet.constructor as PacketConstructor)?.forEach(listener => listener(packet));
        this.maybeApplyProtocolSideEffects(packet);
      }
    } catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
    }
  }

  private tryReadFrame(): Uint8Array | null {
    const lengthInfo = tryDecodeVarInt(this.buffer);
    if (!lengthInfo)
      return null;

    const [frameLength, offset] = lengthInfo;
    const totalLength = offset + frameLength;
    if (this.buffer.length < totalLength)
      return null;

    const framePayload = this.buffer.slice(offset, totalLength);
    this.buffer = this.buffer.slice(totalLength);
    return framePayload;
  }

  private decodePacket(framePayload: Uint8Array): DripleafPacket {
    const packetBody = decodePacketBody(framePayload, this.compressionThreshold);
    const reader = new PacketReader(packetBody);
    const packetId = reader.readVarInt();
    const packetType = packetRegistry.get(this.state, this.incomingDirection, packetId);

    if (!packetType)
      throw new Error(`Unknown packet 0x${packetId.toString(16)} for ${this.state}/${this.incomingDirection}`);

    return packetType.read(reader);
  }

  private maybeApplyProtocolSideEffects(packet: DripleafPacket) {
    if (packet instanceof ClientboundLoginCompressionPacket)
      this.setCompressionThreshold(packet.threshold);
  }
}
