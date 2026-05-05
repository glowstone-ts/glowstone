import { Codecs } from '../buffer';

export enum ParticleStatus {
	All = 0,
	Decreased = 1,
	Minimal = 2,
}

export const ParticleStatusCodec = Codecs.varIntEnum(ParticleStatus);
