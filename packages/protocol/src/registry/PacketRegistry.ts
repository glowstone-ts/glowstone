import type { PacketReader } from "../buffer";
import type { DripleafPacket } from "../packets/DripleafPacket";
import type { Direction, State } from "../types";

export type PacketConstructor<T extends DripleafPacket = DripleafPacket> = {
  new (...args: any[]): T;
  read(reader: PacketReader): T;
  readonly id: number;
  readonly state: State;
  readonly direction: Direction;
};

type DirectionMap = Map<number, PacketConstructor>;
type StateMap = Map<Direction, DirectionMap>;

export class PacketRegistry {
  private readonly packets = new Map<State, StateMap>();

  register<T extends DripleafPacket>(packet: PacketConstructor<T>) {
    const { state, direction, id } = packet;

    let directions = this.packets.get(state);
    if (!directions) {
      directions = new Map();
      this.packets.set(state, directions);
    }

    let ids = directions.get(direction);
    if (!ids) {
      ids = new Map();
      directions.set(direction, ids);
    }

    ids.set(id, packet);
  }

  get<T extends DripleafPacket = DripleafPacket>(state: State, direction: Direction, id: number): PacketConstructor<T> | undefined {
    return this.packets.get(state)?.get(direction)?.get(id) as PacketConstructor<T> | undefined;
  }

  clear() {
    this.packets.clear();
  }
}
