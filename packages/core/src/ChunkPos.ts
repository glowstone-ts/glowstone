export class ChunkPos {
  constructor(
    public x: number,
    public z: number
  ) {}

  pack(): bigint {
    return (BigInt(this.x) & 4294967295n) | ((BigInt(this.z) & 4294967295n) << 32n)
  }

  static unpack(packed: bigint): ChunkPos {
    const x = Number(packed & 4294967295n)
    const z = Number((packed >> 32n) & 4294967295n)
    return new ChunkPos(x, z)
  }
}
