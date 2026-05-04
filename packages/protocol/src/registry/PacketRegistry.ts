import type { PacketReader, PacketWriter } from "../buffer";
import type { DripleafPacket } from "../packets/DripleafPacket";
import { Direction, type State } from "../types";

export type PacketConstructor<T extends DripleafPacket = DripleafPacket> = {
  new (...args: any[]): T;
  readonly codec: {
    encode(writer: PacketWriter, value: T): void;
    decode(reader: PacketReader): T;
  };
};

type PacketDefinition<T extends DripleafPacket = DripleafPacket> = {
  id: number;
  state: State;
  direction: Direction;
  packet: PacketConstructor<T>;
};

type DefinitionMap = Map<number, PacketDefinition>;
type StateMap = Map<Direction, DefinitionMap>;

export class PacketRegistry {
  private readonly packets = new Map<State, StateMap>();
  private readonly definitionsByPacket = new Map<PacketConstructor, PacketDefinition>();

  register(
    state: State,
    clientboundPackets: readonly PacketConstructor[],
    serverboundPackets: readonly PacketConstructor[],
  ) {
    this.registerDirection(state, Direction.Clientbound, clientboundPackets);
    this.registerDirection(state, Direction.Serverbound, serverboundPackets);
    return this;
  }

  get<T extends DripleafPacket = DripleafPacket>(state: State, direction: Direction, id: number): PacketConstructor<T> | undefined {
    return this.packets.get(state)?.get(direction)?.get(id)?.packet as PacketConstructor<T> | undefined;
  }

  getId(packet: DripleafPacket): number | undefined {
    return this.definitionsByPacket.get(packet.constructor as PacketConstructor)?.id;
  }

  getDefinition(packet: DripleafPacket | PacketConstructor): PacketDefinition | undefined {
    const packetType = (typeof packet === "function"
      ? packet
      : packet.constructor) as unknown as PacketConstructor;
    return this.definitionsByPacket.get(packetType);
  }

  clear() {
    this.packets.clear();
    this.definitionsByPacket.clear();
  }

  private registerDirection(
    state: State,
    direction: Direction,
    packets: readonly PacketConstructor[],
  ) {
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

    for (const [id, packet] of packets.entries()) {
      const definition = { id, state, direction, packet } satisfies PacketDefinition;
      ids.set(id, definition);
      this.definitionsByPacket.set(packet, definition);
    }
  }
}
