import { ChatComponentCodec } from '../../datatypes';
import { Codecs } from '../../buffer';
import { DripleafPacket, packetCodec } from '../DripleafPacket';
import type { ChatComponent } from '@dripleaf/chat';
import type { Vec3 } from 'vec3';

export class ClientboundTestInstanceBlockStatusPacket extends DripleafPacket {
	static readonly codec = packetCodec(ClientboundTestInstanceBlockStatusPacket, {
		status: ChatComponentCodec,
		size: Codecs.prefixedOptional(Codecs.vec3d),
	});

	constructor(
		public status: ChatComponent,
		public size: Vec3 | null,
	) {
		super();
	}

}
