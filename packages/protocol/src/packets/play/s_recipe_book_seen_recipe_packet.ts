import { Codecs } from '../../buffer';
import { DripleafPacket, packetCodec } from '../DripleafPacket';

export class ServerboundRecipeBookSeenRecipePacket extends DripleafPacket {
	static readonly codec = packetCodec(ServerboundRecipeBookSeenRecipePacket, {
		recipe: Codecs.varInt,
	});

	constructor(
		public recipe: number,
	) {
		super();
	}
}