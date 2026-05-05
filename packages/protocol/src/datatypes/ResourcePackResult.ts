import { Codecs } from '../buffer';

export enum ResourcePackResult {
	SuccessfullyLoaded = 0,
	Declined = 1,
	FailedDownload = 2,
	Accepted = 3,
	Downloaded = 4,
	InvalidUrl = 5,
	FailedReload = 6,
	Discarded = 7,
}

export const ResourcePackResultCodec = Codecs.varIntEnum(ResourcePackResult);
