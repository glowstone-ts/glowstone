import type { PacketWriter } from "../buffer";
import type { Direction, State } from "../types";

export abstract class DripleafPacket {
  abstract readonly id: number;
  abstract readonly state: State;
  abstract readonly direction: Direction;

  abstract write(writer: PacketWriter): void;
}
