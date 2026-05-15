import { connect } from "node:net"
import { randomUUID } from "node:crypto"
import { Connection, State, ClientIntention, ChatVisibility, HumanoidArm, ParticleStatus } from "../packages/protocol/src"
import * as handshake from "../packages/protocol/src/packets/handshake"
import * as login from "../packages/protocol/src/packets/login"
import * as play from "../packages/protocol/src/packets/play"
import * as configuration from "../packages/protocol/src/packets/configuration"

const host = process.env.REAL_SERVER_HOST
const port = Number(process.env.REAL_SERVER_PORT ?? "25565")

if (!host) {
  console.log("skip: REAL_SERVER_HOST not set")
  process.exit(0)
}

const socket = connect(port, host)
const conn = new Connection(socket, false)

let reachedPlay = false

conn.onPacket(login.ClientboundLoginCompressionPacket, packet => conn.setCompressionThreshold(packet.threshold))
conn.onPacket(login.ClientboundLoginFinishedPacket, () => conn.write(new login.ServerboundLoginAcknowledgedPacket()))
conn.onPacket(play.ClientboundStartConfigurationPacket, () => {
  conn.setState(State.Configuration)
  conn.write(new play.ServerboundConfigurationAcknowledgedPacket())
  conn.write(new configuration.ServerboundClientInformationPacket(
    "en_us", 24, ChatVisibility.Full, true, 0, HumanoidArm.Right, false, true, ParticleStatus.All,
  ))
})
conn.onPacket(configuration.ClientboundFinishConfigurationPacket, () => {
  conn.write(new configuration.ServerboundFinishConfigurationPacket())
  conn.setState(State.Play)
})
conn.onPacket(play.ClientboundLoginPacket, () => {
  reachedPlay = true
  conn.write(new play.ServerboundPlayerLoadedPacket())
  conn.disconnect()
})

conn.on("error", error => {
  console.error(error)
  process.exit(1)
})

conn.on("end", () => {
  if (!reachedPlay) {
    console.error("did not reach play")
    process.exit(1)
  }
  process.exit(0)
})

conn.write(new handshake.ServerboundIntentionPacket(775, host, port, ClientIntention.Login))
conn.setState(State.Login)
conn.write(new login.ServerboundHelloPacket("DripleafBot", randomUUID() as any))
