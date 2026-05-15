import type { Connection } from "@dripleaf/protocol"
import type { ClientContext } from "../context"

export interface ClientPlugin {
  readonly name: string
  register(ctx: ClientContext, conn: Connection): void
}
