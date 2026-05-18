export type GameProfileProperty = {
  name: string
  value: string
  signature?: string | null
}

export type GameProfile = {
  id: string
  name: string
  properties: GameProfileProperty[]
}
