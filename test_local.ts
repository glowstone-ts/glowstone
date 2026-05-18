import { createServer, connect as netConnect } from "node:net";
import { Connection } from "./packages/protocol/src/transport/Connection";
import { ServerboundIntentionPacket } from "./packages/protocol/src/packets/handshake/s_intention_packet";
import { ServerboundHelloPacket } from "./packages/protocol/src/packets/login/s_hello_packet";
import { ServerboundLoginAcknowledgedPacket } from "./packages/protocol/src/packets/login/s_login_acknowledged_packet";
import { ServerboundFinishConfigurationPacket } from "./packages/protocol/src/packets/configuration/s_finish_configuration_packet";
import { ClientboundLoginFinishedPacket } from "./packages/protocol/src/packets/login/c_login_finished_packet";
import { ServerboundClientInformationPacket as PlayClientInformationPacket } from "./packages/protocol/src/packets/play/s_client_information_packet";
import { ServerboundClientInformationPacket } from "./packages/protocol/src/packets/configuration/s_client_information_packet";
import { ClientboundFinishConfigurationPacket } from "./packages/protocol/src/packets/configuration/c_finish_configuration_packet";
import type { GameProfile } from "./packages/protocol/src/datatypes/GameProfile";
import { State, ClientIntention } from "./packages/protocol/src/types";
import { randomUUID } from "node:crypto";
import { ChatVisibility } from "./packages/protocol/src/datatypes/ChatVisibility";
import { HumanoidArm } from "./packages/protocol/src/datatypes/HumanoidArm";
import { ParticleStatus } from "./packages/protocol/src/datatypes/ParticleStatus";

const PORT = 25566;
let testPassed = true;
let completed = false;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    testPassed = false;
  } else {
    console.log("PASS:", message);
  }
}

async function runTest() {
  const server = createServer((socket) => {
    console.log("\n[SERVER] Client connected");
    const conn = new Connection(socket, true);

    conn.on("packet", (packet) => {
      console.log("[SERVER] Received:", packet.constructor.name);

      if (packet instanceof ServerboundIntentionPacket) {
        assert(packet.protocolVersion === 775, "protocol version = 775");
        assert(packet.serverAddress === "localhost", "server address = localhost");
        assert(packet.intention === ClientIntention.Login, "intention = Login");
        conn.setState(State.Login);
      }

      if (packet instanceof ServerboundHelloPacket) {
        assert(packet.name === "DripleafOnTop", "username = DripleafOnTop");
        const profile: GameProfile = { id: randomUUID(), name: packet.name, properties: [] };
        conn.write(new ClientboundLoginFinishedPacket(profile));
      }

      if (packet instanceof ServerboundLoginAcknowledgedPacket) {
        conn.setState(State.Configuration);
        conn.write(new ClientboundFinishConfigurationPacket());
      }

      if (packet instanceof ServerboundFinishConfigurationPacket) {
        conn.setState(State.Play);
      }

      if (packet instanceof ServerboundClientInformationPacket) {
        assert(packet.locale === "en_us", "locale = en_us");
        assert(packet.chatMode === ChatVisibility.Full, "chatMode = Full");
        assert(packet.mainHand === HumanoidArm.Right, "mainHand = Right");
        assert(packet.particleStatus === ParticleStatus.All, "particleStatus = All");
        assert(packet.chatColors === true, "chatColors = true");
        completed = true;
      }
    });

    conn.on("error", (err) => console.error("[SERVER] Error:", err));
  });

  await new Promise<void>((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  console.log(`[TEST] Server listening on 127.0.0.1:${PORT}`);

  const socket = await new Promise<any>((resolve, reject) => {
    const s = netConnect(PORT, "127.0.0.1", () => resolve(s));
    s.on("error", reject);
  });

  const client = new Connection(socket, false);

  client.on("packet", (packet) => {
    console.log("[CLIENT] Received:", packet.constructor.name);

    if (packet instanceof ClientboundLoginFinishedPacket) {
      assert(packet.profile.name === "DripleafOnTop", "login finished correct name");
      client.setState(State.Configuration);
      client.write(new ServerboundLoginAcknowledgedPacket());
      client.write(new ServerboundClientInformationPacket(
        "en_us", 24, ChatVisibility.Full, true, 0,
        HumanoidArm.Right, false, true, ParticleStatus.All,
      ));
    }

    if (packet instanceof ClientboundFinishConfigurationPacket) {
      client.write(new ServerboundFinishConfigurationPacket());
      client.setState(State.Play);
    }
  });

  client.on("error", (err) => {
    console.error("[CLIENT] Error:", err);
    testPassed = false;
  });

  client.write(new ServerboundIntentionPacket(775, "localhost", PORT, ClientIntention.Login));
  client.setState(State.Login);
  client.write(new ServerboundHelloPacket("DripleafOnTop", randomUUID() as any));

  // Wait for completion
  console.log("[TEST] Waiting for protocol flow to complete...");
  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (completed) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
    setTimeout(() => {
      clearInterval(interval);
      if (!completed) {
        console.error("FAIL: Protocol flow did not complete within timeout");
        testPassed = false;
      }
      resolve();
    }, 3000);
  });

  socket.end();
  console.log("\n=== TEST RESULTS ===");
  console.log(testPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED");
  process.exit(testPassed ? 0 : 1);
}

runTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
