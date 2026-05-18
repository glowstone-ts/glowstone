import { connect } from "node:net";
import { Connection } from "./packages/protocol/src/transport/Connection";
import { ServerboundIntentionPacket } from "./packages/protocol/src/packets/handshake/s_intention_packet";
import { ServerboundHelloPacket } from "./packages/protocol/src/packets/login/s_hello_packet";
import { ServerboundLoginAcknowledgedPacket } from "./packages/protocol/src/packets/login/s_login_acknowledged_packet";
import { ClientboundHelloPacket } from "./packages/protocol/src/packets/login/c_hello_packet";
import { ClientboundLoginFinishedPacket } from "./packages/protocol/src/packets/login/c_login_finished_packet";
import { ClientboundLoginCompressionPacket } from "./packages/protocol/src/packets/login/c_login_compression_packet";
import { ClientboundLoginDisconnectPacket } from "./packages/protocol/src/packets/login/c_login_disconnect_packet";
import { State, ClientIntention } from "./packages/protocol/src/types";
import { randomUUID } from "node:crypto";

const HOST = "testpaper.cosmos-ink.net";
const PORT = 25565;

const socket = connect(PORT, HOST, () => {
  console.log("Connected to", HOST);

  const conn = new Connection(socket, false);

  conn.on("packet", (packet) => {
    console.log("[RECV]", packet.constructor.name, JSON.stringify(packet, null, 2));

    if (packet instanceof ClientboundLoginFinishedPacket) {
      console.log("\n=== LOGIN SUCCESS ===");
      conn.setState(State.Configuration);
      const ack = new ServerboundLoginAcknowledgedPacket();
      conn.write(ack);
      console.log("Sent LoginAcknowledged");
    }

    if (packet instanceof ClientboundLoginCompressionPacket) {
      conn.setCompressionThreshold(packet.threshold);
      console.log("Compression threshold:", packet.threshold);
    }

    if (packet instanceof ClientboundLoginDisconnectPacket) {
      console.log("Disconnected:", packet.reason);
      process.exit(1);
    }

    if (packet instanceof ClientboundHelloPacket) {
      console.log("Server wants encryption. shouldAuthenticate:", packet.shouldAuthenticate);
    }
  });

  conn.on("state", (state) => {
    console.log("State changed to:", state);
  });

  conn.on("error", (error) => {
    console.error("Error:", error);
  });

  conn.on("end", () => {
    console.log("Connection closed");
    process.exit(0);
  });

  // Step 1: Handshake
  const handshake = new ServerboundIntentionPacket(
    775, // protocol version for 1.21.4 / 26.1
    HOST,
    PORT,
    ClientIntention.Login,
  );
  conn.write(handshake);
  console.log("Sent Handshake");

  // Step 2: Login Start
  const loginStart = new ServerboundHelloPacket("DripleafOnTop", randomUUID() as any);
  conn.write(loginStart);
  console.log("Sent LoginStart");
});

socket.on("error", (err) => {
  console.error("Socket error:", err);
  process.exit(1);
});
