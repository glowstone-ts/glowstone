import { Codecs } from '../buffer';

export enum ChatVisibility {
	Full = 0,
	System = 1,
	Hidden = 2,
}

export const ChatVisibilityCodec = Codecs.varIntEnum(ChatVisibility);
