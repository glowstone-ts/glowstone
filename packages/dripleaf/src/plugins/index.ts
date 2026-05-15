import type { ClientPlugin } from "./types"
import { ConnectionPlugin } from "./ConnectionPlugin"
import { KeepAlivePlugin } from "./KeepAlivePlugin"
import { ConfigurationPlugin } from "./ConfigurationPlugin"
import { PlayPlugin } from "./PlayPlugin"
import { WorldPlugin } from "./WorldPlugin"
import { EntityPlugin } from "./EntityPlugin"
import { InventoryPlugin } from "./InventoryPlugin"

export const defaultPlugins: ClientPlugin[] = [
  new KeepAlivePlugin(),
  new ConfigurationPlugin(),
  new PlayPlugin(),
  new WorldPlugin(),
  new EntityPlugin(),
  new InventoryPlugin(),
]

export { ConnectionPlugin, KeepAlivePlugin, ConfigurationPlugin, PlayPlugin, WorldPlugin, EntityPlugin, InventoryPlugin }
export type { ClientPlugin } from "./types"
