import { codec, type PacketReader, type PacketWriter } from "../buffer"
import { Vec3 } from "vec3"

export class BlockPos {
	static readonly codec = codec<BlockPos>({
		encode(writer: PacketWriter, value: BlockPos) {
			writer.writeLong(value.pack());
		},
		decode(reader: PacketReader): BlockPos {
			return BlockPos.unpack(reader.readLong())
		},
	})

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
		const x = this.x
		const y = this.y
		const z = this.z
		if (x < -33554432 || x > 33554431 || y < -2048 || y > 2047 || z < -33554432 || z > 33554431)
			throw new Error(`Vec3 out of range: ${x}, ${y}, ${z}`)

		return (
			(BigInt(x & 0x3ffffff) << 38n) |
			(BigInt(z & 0x3ffffff) << 12n) |
			BigInt(y & 0xfff)
		)
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