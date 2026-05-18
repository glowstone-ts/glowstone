import { ChatComponentCodec } from '../../datatypes';
import { type PacketReader, type PacketWriter } from '../../buffer';
import { DripleafPacket, packetCodec } from '../DripleafPacket';
import type { ChatComponent } from '@dripleaf/chat';

export type DisguisedChatTypeBound = {
	chatType: number;
	name: ChatComponent;
	targetName: ChatComponent | null;
};

export class ClientboundDisguisedChatPacket extends DripleafPacket {
	static readonly codec = packetCodec({
		encode(writer: PacketWriter, value: ClientboundDisguisedChatPacket) {
			ChatComponentCodec.encode(writer, value.message);
			writer.writeVarInt(value.chatType.chatType);
			ChatComponentCodec.encode(writer, value.chatType.name);
			writer.writePrefixedOptional(value.chatType.targetName, v => ChatComponentCodec.encode(writer, v));
		},
		decode(reader: PacketReader): ClientboundDisguisedChatPacket {
			const message = ChatComponentCodec.decode(reader);
			const chatTypeId = reader.readVarInt();
			const name = ChatComponentCodec.decode(reader);
			const targetName = reader.readPrefixedOptional(() => ChatComponentCodec.decode(reader));
			return new ClientboundDisguisedChatPacket(message, { chatType: chatTypeId, name, targetName });
		},
	});

	constructor(
		public message: ChatComponent,
		public chatType: DisguisedChatTypeBound,
	) {
		super();
	}
}