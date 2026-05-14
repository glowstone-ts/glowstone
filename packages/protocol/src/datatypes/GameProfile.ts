import { codec, type PacketReader, type PacketWriter } from "../buffer";

type GameProfileProperty = {
	name: string;
	value: string;
	signature?: string | null;
};

export type GameProfile = {
	id: string;
	name: string;
	properties: GameProfileProperty[];
};

export const GameProfileCodec = codec<GameProfile>({
	encode(writer: PacketWriter, value: GameProfile) {
		writer.writeUUID(value.id);
		writer.writeString(value.name);
		writer.writeArray(value.properties, property => {
			writer.writeString(property.name);
			writer.writeString(property.value);
			writer.writePrefixedOptional(property.signature, signature => writer.writeString(signature));
		});
	},
	decode(reader: PacketReader): GameProfile {
		const id = reader.readUUID();
		const name = reader.readString();
		const properties = reader.readArray(() => ({
			name: reader.readString(),
			value: reader.readString(),
			signature: reader.readPrefixedOptional(() => reader.readString()),
		}));
		return { id, name, properties };
	},
});