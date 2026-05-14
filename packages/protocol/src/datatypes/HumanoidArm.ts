import { Codecs } from '../buffer';

export enum HumanoidArm {
	Left = 0,
	Right = 1,
}

export const HumanoidArmCodec = Codecs.varIntEnum(HumanoidArm);
