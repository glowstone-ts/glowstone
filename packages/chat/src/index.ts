export type ChatPrimitive = string | number | boolean | null

export type ChatComponent =
	| string
	| {
		text?: string
		translate?: string
		with?: Array<ChatPrimitive | ChatComponent>
		extra?: ChatComponent[]
		color?: string
		bold?: boolean
		italic?: boolean
		underlined?: boolean
		strikethrough?: boolean
		obfuscated?: boolean
		reset?: boolean
	}

export type FormattedText = ChatComponent

export function text(value: string): ChatComponent {
	return { text: value }
}

export function translate(key: string, args: Array<ChatPrimitive | ChatComponent> = []): ChatComponent {
	return { translate: key, with: args }
}

export function append(base: ChatComponent, ...extra: ChatComponent[]): ChatComponent {
	if (typeof base === "string") return { text: base, extra }
	return { ...base, extra: [...(base.extra ?? []), ...extra] }
}
