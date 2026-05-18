import { Vec3 } from "vec3"

export class BlockPos {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}

  static fromVec3(value: Vec3): BlockPos {
    return new BlockPos(value.x, value.y, value.z)
  }

  toVec3(): Vec3 {
    return new Vec3(this.x, this.y, this.z)
  }

  pack(): bigint {
    const bx = BigInt(this.x) & 0x3FFFFFFn
    const bz = BigInt(this.z) & 0x3FFFFFFn
    const by = BigInt(this.y) & 0xFFFn
    return (bx << 38n) | (bz << 12n) | by
  }

  static unpack(value: bigint): BlockPos {
    let x = Number(value >> 38n)
    let y = Number(value & 0xfffn)
    let z = Number((value >> 12n) & 0x3ffffffn)

    if (x >= 1 << 25) x -= 1 << 26
    if (y >= 1 << 11) y -= 1 << 12
    if (z >= 1 << 25) z -= 1 << 26

    return new BlockPos(x, y, z)
  }
}
