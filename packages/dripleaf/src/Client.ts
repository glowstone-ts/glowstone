import { EventEmitter } from "node:events"
import { connect as tcpConnect } from "node:net"
import { resolveSrv } from "node:dns"
import { Connection, State, InteractionHand, BlockFace, play } from "@dripleaf/protocol"
import type { GameProfile } from "@dripleaf/core"
import { BlockPos } from "@dripleaf/core"
import { Window } from "@dripleaf/inventory"
import { RegistryManager } from "@dripleaf/registry"
import type { World } from "@dripleaf/world"
import type { EntityData } from "@dripleaf/entity"
import type { ClientContext, EquipmentEntry } from "./context"
import { defaultPlugins, ConnectionPlugin } from "./plugins"

type ClientEvents = {
  spawn: (packet: play.ClientboundLoginPacket) => void
  chat: (message: string, sender: string | null) => void
  disconnect: (reason: string) => void
  error: (error: Error) => void
  end: () => void
  packet: (packet: unknown) => void
  state: (state: State) => void
  move: () => void
  health: (health: number, food: number, saturation: number) => void
  heldItemChange: (slot: number) => void
  entitySpawn: (entity: EntityData) => void
  entityDespawn: (entityId: number) => void
}

export class Client {
  private emitter = new EventEmitter()
  private ctx: ClientContext
  private connectionPlugin = new ConnectionPlugin()

  connection: Connection | null = null
  username: string
  profile: GameProfile | null = null
  loggedIn = false
  entityId = -1

  position = { x: 0, y: 0, z: 0 }
  yaw = 0
  pitch = 0
  onGround = true

  health = 20
  food = 20
  saturation = 5

  world: World | null = null
  entities: Map<number, EntityData> = new Map()

  inventory: Window
  heldItem = 0
  equipment: Map<number, EquipmentEntry[]> = new Map()

  readonly registries = new RegistryManager()

  constructor(username: string) {
    this.username = username
    this.inventory = new Window(0, "inventory", "Inventory", 46)
    this.ctx = this.createContext()
  }

  private createContext(): ClientContext {
    const client = this
    return {
      get username() { return client.username },
      get connection() { return client.connection },
      set connection(v) { client.connection = v },
      get profile() { return client.profile },
      set profile(v) { client.profile = v },
      get loggedIn() { return client.loggedIn },
      set loggedIn(v) { client.loggedIn = v },
      get entityId() { return client.entityId },
      set entityId(v) { client.entityId = v },
      get position() { return client.position },
      get yaw() { return client.yaw },
      set yaw(v) { client.yaw = v },
      get pitch() { return client.pitch },
      set pitch(v) { client.pitch = v },
      get onGround() { return client.onGround },
      set onGround(v) { client.onGround = v },
      get health() { return client.health },
      set health(v) { client.health = v },
      get food() { return client.food },
      set food(v) { client.food = v },
      get saturation() { return client.saturation },
      set saturation(v) { client.saturation = v },
      get world() { return client.world },
      set world(v) { client.world = v },
      get entities() { return client.entities },
      get inventory() { return client.inventory },
      get heldItem() { return client.heldItem },
      set heldItem(v) { client.heldItem = v },
      sequence: 0,
      get equipment() { return client.equipment },
      get registries() { return client.registries },
      chunkBatchSize: 0,
      emitter: this.emitter,
      emit: (event, ...args) => client.emit(event, ...args),
    }
  }

  on<K extends keyof ClientEvents>(event: K, listener: ClientEvents[K]): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void)
    return this
  }

  off<K extends keyof ClientEvents>(event: K, listener: ClientEvents[K]): this {
    this.emitter.off(event, listener as (...args: unknown[]) => void)
    return this
  }

  blockAt(pos: BlockPos) {
    return this.world?.getBlock(pos)
  }

  async connect(host: string, port = 25565): Promise<void> {
    const resolved = await this.resolveSrv(host, port)
    return new Promise((resolve, reject) => {
      const socket = tcpConnect(resolved.port, resolved.host, () => {
        this.connection = new Connection(socket, false)
        this.setupHandlers()
        this.connectionPlugin.startLogin(this.connection, host, resolved.port, this.username)
        resolve()
      })
      socket.on("error", reject)
      socket.setTimeout(10000)
    })
  }

  private isIpAddress(host: string): boolean {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\[?([0-9a-fA-F:]+)\]?$/.test(host)
  }

  private resolveSrv(host: string, port: number): Promise<{ host: string; port: number }> {
    if (this.isIpAddress(host) || port !== 25565)
      return Promise.resolve({ host, port })
    return new Promise((resolve) => {
      resolveSrv(`_minecraft._tcp.${host}`, (err, records) => {
        if (err || !records?.length) {
          resolve({ host, port })
          return
        }
        const sorted = records.sort((a, b) => a.priority - b.priority || b.weight - a.weight)
        const srv = sorted[0]!
        resolve({ host: srv.name, port: srv.port })
      })
    })
  }

  chat(message: string): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    if (message.startsWith("/")) {
      this.connection.write(new play.ServerboundChatCommandPacket(message.slice(1)))
    } else {
      this.connection.write(new play.ServerboundChatPacket(
        message,
        BigInt(Date.now()),
        0n,
        null,
        { offset: 0, acknowledged: new Uint8Array(3), checksum: 0 },
      ))
    }
  }

  move(x: number, y: number, z: number): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundMovePlayerPosPacket(x, y, z, this.onGround, false))
    this.position.x = x
    this.position.y = y
    this.position.z = z
    this.emit("move")
  }

  look(yaw: number, pitch: number): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundMovePlayerRotPacket(yaw, pitch, this.onGround, false))
    this.yaw = yaw
    this.pitch = pitch
    this.emit("move")
  }

  moveAndLook(x: number, y: number, z: number, yaw: number, pitch: number): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundMovePlayerPosRotPacket(x, y, z, yaw, pitch, this.onGround, false))
    this.position.x = x
    this.position.y = y
    this.position.z = z
    this.yaw = yaw
    this.pitch = pitch
    this.emit("move")
  }

  setHeldItem(slot: number): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundSetCarriedItemPacket(slot))
    this.heldItem = slot
    this.emit("heldItemChange", slot)
  }

  lookAt(x: number, y: number, z: number): void {
    const dx = x - this.position.x
    const dy = y - (this.position.y + 1.62)
    const dz = z - this.position.z
    const h = Math.sqrt(dx * dx + dz * dz)
    this.look((-Math.atan2(dx, dz) * 180) / Math.PI, (-Math.atan2(dy, h) * 180) / Math.PI)
  }

  swingArm(hand: InteractionHand = InteractionHand.MainHand): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundSwingPacket(hand))
  }

  attack(entityId: number): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundAttackPacket(entityId))
  }

  mine(x: number, y: number, z: number): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundPlayerActionPacket(
      play.PlayerAction.StartDestroyBlock,
      new BlockPos(x, y, z),
      BlockFace.Up,
      this.ctx.sequence++,
    ))
  }

  blockInteract(x: number, y: number, z: number, face: BlockFace): void {
    if (!this.connection || !this.loggedIn) throw new Error("Not connected")
    this.connection.write(new play.ServerboundUseItemOnPacket(
      InteractionHand.MainHand,
      {
        blockPos: new BlockPos(x, y, z),
        direction: face,
        location: { x: this.position.x, y: this.position.y, z: this.position.z } as { x: number; y: number; z: number },
        inside: false,
        worldBorder: false,
      },
      this.ctx.sequence++,
    ))
  }

  disconnect(): void {
    this.connection?.disconnect()
  }

  private emit(event: string, ...args: unknown[]) {
    this.emitter.emit(event, ...args)
  }

  private setupHandlers(): void {
    const conn = this.connection!
    this.connectionPlugin.register(this.ctx, conn)
    for (const plugin of defaultPlugins)
      plugin.register(this.ctx, conn)
  }
}
