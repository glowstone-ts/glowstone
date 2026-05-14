import { ParticleType } from '@dripleaf/registry'
import { Codecs, type PacketReader, type PacketWriter } from '../buffer'
import type { Vec3 } from 'vec3'

export type ParticleOptions =
	| { type: ParticleType }
	| { type: ParticleType.DragonBreath; power: number }
	| { type: ParticleType.Dust; color: number; scale: number }
	| { type: ParticleType.DustColorTransition; fromColor: number; toColor: number; scale: number }
	| { type: ParticleType.Effect | ParticleType.InstantEffect; color: number; power: number }
	| { type: ParticleType.EntityEffect | ParticleType.Flash | ParticleType.TintedLeaves; color: number }
	| { type: ParticleType.SculkCharge; roll: number }
	| { type: ParticleType.Shriek; delay: number }
	| { type: ParticleType.Trail; target: Vec3; color: number; duration: number }

const SIMPLE_PARTICLES = new Set<ParticleType>([
	ParticleType.AngryVillager,
	ParticleType.Bubble,
	ParticleType.Cloud,
	ParticleType.CopperFireFlame,
	ParticleType.Crit,
	ParticleType.DamageIndicator,
	ParticleType.DrippingLava,
	ParticleType.FallingLava,
	ParticleType.LandingLava,
	ParticleType.DrippingWater,
	ParticleType.FallingWater,
	ParticleType.ElderGuardian,
	ParticleType.EnchantedHit,
	ParticleType.Enchant,
	ParticleType.EndRod,
	ParticleType.ExplosionEmitter,
	ParticleType.Explosion,
	ParticleType.Gust,
	ParticleType.SmallGust,
	ParticleType.GustEmitterLarge,
	ParticleType.GustEmitterSmall,
	ParticleType.SonicBoom,
	ParticleType.Firework,
	ParticleType.Fishing,
	ParticleType.Flame,
	ParticleType.Infested,
	ParticleType.CherryLeaves,
	ParticleType.PaleOakLeaves,
	ParticleType.SculkSoul,
	ParticleType.SculkChargePop,
	ParticleType.SoulFireFlame,
	ParticleType.Soul,
	ParticleType.HappyVillager,
	ParticleType.Composter,
	ParticleType.Heart,
	ParticleType.PauseMobGrowth,
	ParticleType.ResetMobGrowth,
	ParticleType.ItemSlime,
	ParticleType.ItemCobweb,
	ParticleType.ItemSnowball,
	ParticleType.LargeSmoke,
	ParticleType.Lava,
	ParticleType.Mycelium,
	ParticleType.Note,
	ParticleType.Poof,
	ParticleType.Portal,
	ParticleType.Rain,
	ParticleType.Smoke,
	ParticleType.WhiteSmoke,
	ParticleType.Sneeze,
	ParticleType.Spit,
	ParticleType.SquidInk,
	ParticleType.SweepAttack,
	ParticleType.TotemOfUndying,
	ParticleType.Underwater,
	ParticleType.Splash,
	ParticleType.Witch,
	ParticleType.BubblePop,
	ParticleType.CurrentDown,
	ParticleType.BubbleColumnUp,
	ParticleType.Nautilus,
	ParticleType.Dolphin,
	ParticleType.CampfireCosySmoke,
	ParticleType.CampfireSignalSmoke,
	ParticleType.DrippingHoney,
	ParticleType.FallingHoney,
	ParticleType.LandingHoney,
	ParticleType.FallingNectar,
	ParticleType.FallingSporeBlossom,
	ParticleType.Ash,
	ParticleType.CrimsonSpore,
	ParticleType.WarpedSpore,
	ParticleType.SporeBlossomAir,
	ParticleType.DrippingObsidianTear,
	ParticleType.FallingObsidianTear,
	ParticleType.LandingObsidianTear,
	ParticleType.ReversePortal,
	ParticleType.WhiteAsh,
	ParticleType.SmallFlame,
	ParticleType.Snowflake,
	ParticleType.DrippingDripstoneLava,
	ParticleType.FallingDripstoneLava,
	ParticleType.DrippingDripstoneWater,
	ParticleType.FallingDripstoneWater,
	ParticleType.GlowSquidInk,
	ParticleType.Glow,
	ParticleType.WaxOn,
	ParticleType.WaxOff,
	ParticleType.ElectricSpark,
	ParticleType.Scrape,
	ParticleType.EggCrack,
	ParticleType.DustPlume,
	ParticleType.TrialSpawnerDetection,
	ParticleType.TrialSpawnerDetectionOminous,
	ParticleType.VaultConnection,
	ParticleType.OminousSpawning,
	ParticleType.RaidOmen,
	ParticleType.TrialOmen,
	ParticleType.Firefly,
])

export function encodeParticleOptions(writer: PacketWriter, value: ParticleOptions) {
	Codecs.varIntEnum(ParticleType).encode(writer, value.type)
	switch (value.type) {
		case ParticleType.DragonBreath:
			writer.writeFloat((value as Extract<ParticleOptions, { type: ParticleType.DragonBreath }>).power)
			return
		case ParticleType.Dust:
			writer.writeInt((value as Extract<ParticleOptions, { type: ParticleType.Dust }>).color)
			writer.writeFloat((value as Extract<ParticleOptions, { type: ParticleType.Dust }>).scale)
			return
		case ParticleType.DustColorTransition:
			writer.writeInt((value as Extract<ParticleOptions, { type: ParticleType.DustColorTransition }>).fromColor)
			writer.writeInt((value as Extract<ParticleOptions, { type: ParticleType.DustColorTransition }>).toColor)
			writer.writeFloat((value as Extract<ParticleOptions, { type: ParticleType.DustColorTransition }>).scale)
			return
		case ParticleType.Effect:
		case ParticleType.InstantEffect:
			writer.writeInt((value as Extract<ParticleOptions, { type: ParticleType.Effect | ParticleType.InstantEffect }>).color)
			writer.writeFloat((value as Extract<ParticleOptions, { type: ParticleType.Effect | ParticleType.InstantEffect }>).power)
			return
		case ParticleType.EntityEffect:
		case ParticleType.Flash:
		case ParticleType.TintedLeaves:
			writer.writeInt((value as Extract<ParticleOptions, { type: ParticleType.EntityEffect | ParticleType.Flash | ParticleType.TintedLeaves }>).color)
			return
		case ParticleType.SculkCharge:
			writer.writeFloat((value as Extract<ParticleOptions, { type: ParticleType.SculkCharge }>).roll)
			return
		case ParticleType.Shriek:
			writer.writeVarInt((value as Extract<ParticleOptions, { type: ParticleType.Shriek }>).delay)
			return
		case ParticleType.Trail:
			writer.writeVec3d((value as Extract<ParticleOptions, { type: ParticleType.Trail }>).target)
			writer.writeInt((value as Extract<ParticleOptions, { type: ParticleType.Trail }>).color)
			writer.writeVarInt((value as Extract<ParticleOptions, { type: ParticleType.Trail }>).duration)
			return
		default:
			if (!SIMPLE_PARTICLES.has(value.type))
				throw new Error(`Unsupported particle type: ${value.type}`)
			return
	}
}

export function decodeParticleOptions(reader: PacketReader): ParticleOptions {
	const type = Codecs.varIntEnum(ParticleType).decode(reader)
	switch (type) {
		case ParticleType.DragonBreath:
			return { type, power: reader.readFloat() }
		case ParticleType.Dust:
			return { type, color: reader.readInt(), scale: reader.readFloat() }
		case ParticleType.DustColorTransition:
			return { type, fromColor: reader.readInt(), toColor: reader.readInt(), scale: reader.readFloat() }
		case ParticleType.Effect:
		case ParticleType.InstantEffect:
			return { type, color: reader.readInt(), power: reader.readFloat() }
		case ParticleType.EntityEffect:
		case ParticleType.Flash:
		case ParticleType.TintedLeaves:
			return { type, color: reader.readInt() }
		case ParticleType.SculkCharge:
			return { type, roll: reader.readFloat() }
		case ParticleType.Shriek:
			return { type, delay: reader.readVarInt() }
		case ParticleType.Trail:
			return { type, target: reader.readVec3d(), color: reader.readInt(), duration: reader.readVarInt() }
		default:
			if (!SIMPLE_PARTICLES.has(type))
				throw new Error(`Unsupported particle type: ${type}`)
			return { type }
	}
}

import { codec } from '../buffer'

export const particleCodec = codec<ParticleOptions>({
	encode(writer: PacketWriter, value: ParticleOptions) {
		encodeParticleOptions(writer, value)
	},
	decode(reader: PacketReader): ParticleOptions {
		return decodeParticleOptions(reader)
	},
})
