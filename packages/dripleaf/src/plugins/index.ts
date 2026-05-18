import type { ClientPlugin } from "./types"
import { ConnectionPlugin } from "./ConnectionPlugin"
import { KeepAlivePlugin } from "./KeepAlivePlugin"
import { ConfigurationPlugin } from "./ConfigurationPlugin"
import { PlayPlugin } from "./PlayPlugin"
import { WorldPlugin } from "./WorldPlugin"
import { EntityPlugin } from "./EntityPlugin"
import { InventoryPlugin } from "./InventoryPlugin"
import { MiningPlugin } from "./MiningPlugin"
import { TickPlugin } from "./TickPlugin"

export const defaultPlugins: ClientPlugin[] = [
  new KeepAlivePlugin(),
  new ConfigurationPlugin(),
  new PlayPlugin(),
  new WorldPlugin(),
  new EntityPlugin(),
  new InventoryPlugin(),
  new MiningPlugin(),
  new TickPlugin(),
]

export {
  ConnectionPlugin,
  KeepAlivePlugin,
  ConfigurationPlugin,
  PlayPlugin,
  WorldPlugin,
  EntityPlugin,
  InventoryPlugin,
  MiningPlugin,
  TickPlugin,
}
export { startMining, finishMining, stopMining } from "./MiningPlugin"
export type { ClientPlugin } from "./types"
