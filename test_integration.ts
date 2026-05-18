import { connect } from "node:net";
import { randomUUID } from "node:crypto";
import type { UUID } from "node:crypto";
import { Connection, State, ClientIntention, ChatVisibility, HumanoidArm, ParticleStatus } from "./packages/protocol/src";
import * as handshake from "./packages/protocol/src/packets/handshake";
import * as login from "./packages/protocol/src/packets/login";
import * as play from "./packages/protocol/src/packets/play";
import * as configuration from "./packages/protocol/src/packets/configuration";

const HOST = process.argv[2] ?? "127.0.0.1";
const PORT = parseInt(process.argv[3] ?? "25565", 10);

let passed = 0;
let failed = 0;
const failedPackets: string[] = [];
const decodedPackets = new Map<string, number>();

function pass(msg: string) { passed++; console.log(`  PASS: ${msg}`); }
function fail(msg: string) { failed++; console.log(`  FAIL: ${msg}`); failedPackets.push(msg); }

async function main() {
  console.log(`Connecting to ${HOST}:${PORT}...`);

  const socket = connect(PORT, HOST, () => {
    console.log("TCP connected");
    const conn = new Connection(socket, false);

    conn.on("error", (err) => fail(`Connection error: ${err.message}`));
    conn.on("end", () => console.log("Connection ended"));

    conn.on("packet", (pkt) => {
      const name = pkt.constructor.name;
      decodedPackets.set(name, (decodedPackets.get(name) ?? 0) + 1);
    });

    conn.on("state", (s) => console.log(`State: ${s}`));

    // ---- LOGIN ----
    conn.onPacket(login.ClientboundHelloPacket, (pkt) => {
      pass(`Login Hello received (auth=${pkt.shouldAuthenticate})`);
    });

    conn.onPacket(login.ClientboundLoginCompressionPacket, (pkt) => {
      pass(`Compression threshold: ${pkt.threshold}`);
      conn.setCompressionThreshold(pkt.threshold);
    });

    conn.onPacket(login.ClientboundLoginFinishedPacket, (pkt) => {
      pass(`Login finished: ${pkt.profile.name}`);
      conn.setState(State.Configuration);
      conn.write(new login.ServerboundLoginAcknowledgedPacket());
      conn.write(new configuration.ServerboundClientInformationPacket(
        "en_us", 24, ChatVisibility.Full, true, 0,
        HumanoidArm.Right, false, true, ParticleStatus.All,
      ));
    });

    conn.onPacket(login.ClientboundLoginDisconnectPacket, (pkt) => {
      fail(`Login disconnect: ${JSON.stringify(pkt.reason)}`);
    });

    // ---- CONFIGURATION ----
    conn.onPacket(configuration.ClientboundRegistryDataPacket, () => {
      pass("Registry data received");
    });

    conn.onPacket(configuration.ClientboundUpdateTagsPacket, () => {
      pass("Config UpdateTags received");
    });

    conn.onPacket(configuration.ClientboundKeepAlivePacket, (pkt) => {
      pass(`Config KeepAlive received`);
      conn.write(new configuration.ServerboundKeepAlivePacket(pkt.keepAliveId));
    });

    conn.onPacket(configuration.ClientboundCustomPayloadPacket, () => {
      pass("Config CustomPayload received");
    });

    conn.onPacket(configuration.ClientboundResourcePackPushPacket, (pkt) => {
      pass(`Resource pack push: ${pkt.url.substring(0, 60)}`);
    });

    conn.onPacket(configuration.ClientboundResourcePackPopPacket, () => {
      pass("Resource pack pop received");
    });

    conn.onPacket(configuration.ClientboundSelectKnownPacksPacket, (pkt) => {
      pass(`SelectKnownPacks: ${pkt.knownPacks.length} packs`);
      conn.write(new configuration.ServerboundSelectKnownPacksPacket([]));
    });

    conn.onPacket(configuration.ClientboundServerLinksPacket, () => {
      pass("ServerLinks received");
    });

    conn.onPacket(configuration.ClientboundUpdateEnabledFeaturesPacket, () => {
      pass("EnabledFeatures received");
    });

    conn.onPacket(configuration.ClientboundDisconnectPacket, (pkt) => {
      fail(`Config disconnect: ${JSON.stringify(pkt.reason)}`);
    });

    conn.onPacket(configuration.ClientboundFinishConfigurationPacket, () => {
      pass("FinishConfiguration received");
      conn.write(new configuration.ServerboundFinishConfigurationPacket());
      conn.setState(State.Play);
    });

    // ---- PLAY ----
    conn.onPacket(play.ClientboundLoginPacket, (pkt) => {
      pass(`Spawned! eid=${pkt.entityId}`);
      conn.write(new play.ServerboundPlayerLoadedPacket());
    });

    conn.onPacket(play.ClientboundPlayerPositionPacket, (pkt) => {
      pass(`Teleport id=${pkt.teleportId}`);
      conn.write(new play.ServerboundAcceptTeleportationPacket(pkt.teleportId));
    });

    conn.onPacket(play.ClientboundKeepAlivePacket, (pkt) => {
      pass(`Play KeepAlive received`);
      conn.write(new play.ServerboundKeepAlivePacket(pkt.keepAliveId));
    });

    conn.onPacket(play.ClientboundSystemChatPacket, () => pass("SystemChat received"));
    conn.onPacket(play.ClientboundSetHealthPacket, () => pass("SetHealth received"));
    conn.onPacket(play.ClientboundSetTimePacket, () => pass("SetTime received"));
    conn.onPacket(play.ClientboundPlayerInfoUpdatePacket, () => pass("PlayerInfoUpdate received"));
    conn.onPacket(play.ClientboundCommandsPacket, () => pass("Commands received"));
    conn.onPacket(play.ClientboundGameEventPacket, () => pass("GameEvent received"));
    conn.onPacket(play.ClientboundAddEntityPacket, () => pass("AddEntity received"));
    conn.onPacket(play.ClientboundSetEntityDataPacket, () => pass("SetEntityData received"));
    conn.onPacket(play.ClientboundSetExperiencePacket, () => pass("SetExperience received"));
    conn.onPacket(play.ClientboundUpdateMobEffectPacket, () => pass("UpdateMobEffect received"));
    conn.onPacket(play.ClientboundRemoveMobEffectPacket, () => pass("RemoveMobEffect received"));
    conn.onPacket(play.ClientboundRespawnPacket, () => pass("Respawn received"));
    conn.onPacket(play.ClientboundSoundPacket, () => pass("Sound received"));
    conn.onPacket(play.ClientboundSoundEntityPacket, () => pass("SoundEntity received"));
    conn.onPacket(play.ClientboundLevelParticlesPacket, () => pass("LevelParticles received"));
    conn.onPacket(play.ClientboundBlockUpdatePacket, () => pass("BlockUpdate received"));
    conn.onPacket(play.ClientboundSectionBlocksUpdatePacket, () => pass("SectionBlocksUpdate received"));
    conn.onPacket(play.ClientboundSetEquipmentPacket, () => pass("SetEquipment received"));
    conn.onPacket(play.ClientboundContainerSetContentPacket, () => pass("ContainerSetContent received"));
    conn.onPacket(play.ClientboundContainerSetSlotPacket, () => pass("ContainerSetSlot received"));
    conn.onPacket(play.ClientboundOpenScreenPacket, () => pass("OpenScreen received"));
    conn.onPacket(play.ClientboundSetTitleTextPacket, () => pass("SetTitleText received"));
    conn.onPacket(play.ClientboundSetSubtitleTextPacket, () => pass("SetSubtitleText received"));
    conn.onPacket(play.ClientboundSetTitlesAnimationPacket, () => pass("SetTitlesAnimation received"));
    conn.onPacket(play.ClientboundSetActionBarTextPacket, () => pass("SetActionBarText received"));
    conn.onPacket(play.ClientboundClearTitlesPacket, () => pass("ClearTitles received"));
    conn.onPacket(play.ClientboundBlockDestructionPacket, () => pass("BlockDestruction received"));
    conn.onPacket(play.ClientboundBlockEventPacket, () => pass("BlockEvent received"));
    conn.onPacket(play.ClientboundBlockEntityDataPacket, () => pass("BlockEntityData received"));
    conn.onPacket(play.ClientboundDamageEventPacket, () => pass("DamageEvent received"));
    conn.onPacket(play.ClientboundHurtAnimationPacket, () => pass("HurtAnimation received"));
    conn.onPacket(play.ClientboundAnimatePacket, () => pass("Animate received"));
    conn.onPacket(play.ClientboundCooldownPacket, () => pass("Cooldown received"));
    conn.onPacket(play.ClientboundRemoveEntitiesPacket, () => pass("RemoveEntities received"));
    conn.onPacket(play.ClientboundTakeItemEntityPacket, () => pass("TakeItemEntity received"));
    conn.onPacket(play.ClientboundPlayerAbilitiesPacket, () => pass("PlayerAbilities received"));
    conn.onPacket(play.ClientboundSetPassengersPacket, () => pass("SetPassengers received"));
    conn.onPacket(play.ClientboundChunkBatchStartPacket, () => pass("ChunkBatchStart received"));
    conn.onPacket(play.ClientboundChunkBatchFinishedPacket, () => pass("ChunkBatchFinished received"));
    conn.onPacket(play.ClientboundSetDefaultSpawnPositionPacket, () => pass("SetDefaultSpawnPosition received"));
    conn.onPacket(play.ClientboundServerDataPacket, () => pass("ServerData received"));
    conn.onPacket(play.ClientboundUpdateRecipesPacket, () => pass("UpdateRecipes received"));
    conn.onPacket(play.ClientboundUpdateTagsPacket, () => pass("Play UpdateTags received"));
    conn.onPacket(play.ClientboundSetHeldSlotPacket, () => pass("SetHeldSlot received"));
    conn.onPacket(play.ClientboundSetSimulationDistancePacket, () => pass("SetSimulationDistance received"));
    conn.onPacket(play.ClientboundSetChunkCacheRadiusPacket, () => pass("SetChunkCacheRadius received"));
    conn.onPacket(play.ClientboundSetChunkCacheCenterPacket, () => pass("SetChunkCacheCenter received"));
    conn.onPacket(play.ClientboundInitializeBorderPacket, () => pass("InitializeBorder received"));
    conn.onPacket(play.ClientboundDisconnectPacket, (pkt) => {
      fail(`Play disconnect: ${JSON.stringify(pkt.reason)}`);
    });

    conn.onPacket(play.ClientboundLevelChunkWithLightPacket, () => {
      pass("LevelChunkWithLight received");
    });

    conn.onPacket(play.ClientboundLightUpdatePacket, () => {
      pass("LightUpdate received");
    });

    conn.onPacket(play.ClientboundPlayerInfoRemovePacket, () => {
      pass("PlayerInfoRemove received");
    });

    conn.onPacket(play.ClientboundRecipeBookAddPacket, () => {
      pass("RecipeBookAdd received");
    });

    conn.onPacket(play.ClientboundRecipeBookRemovePacket, () => {
      pass("RecipeBookRemove received");
    });

    conn.onPacket(play.ClientboundRecipeBookSettingsPacket, () => {
      pass("RecipeBookSettings received");
    });

    conn.onPacket(play.ClientboundAwardStatsPacket, () => {
      pass("AwardStats received");
    });

    conn.onPacket(play.ClientboundBossEventPacket, () => {
      pass("BossEvent received");
    });

    conn.onPacket(play.ClientboundChangeDifficultyPacket, () => {
      pass("ChangeDifficulty received");
    });

    conn.onPacket(play.ClientboundSetCameraPacket, () => {
      pass("SetCamera received");
    });

    conn.onPacket(play.ClientboundSetObjectivePacket, () => {
      pass("SetObjective received");
    });

    conn.onPacket(play.ClientboundSetScorePacket, () => {
      pass("SetScore received");
    });

    conn.onPacket(play.ClientboundSetDisplayObjectivePacket, () => {
      pass("SetDisplayObjective received");
    });

    conn.onPacket(play.ClientboundSetPlayerTeamPacket, () => {
      pass("SetPlayerTeam received");
    });

    conn.onPacket(play.ClientboundMapItemDataPacket, () => {
      pass("MapItemData received");
    });

    conn.onPacket(play.ClientboundMerchantOffersPacket, () => {
      pass("MerchantOffers received");
    });

    conn.onPacket(play.ClientboundUpdateAdvancementsPacket, () => {
      pass("UpdateAdvancements received");
    });

    conn.onPacket(play.ClientboundUpdateAttributesPacket, () => {
      pass("UpdateAttributes received");
    });

    conn.onPacket(play.ClientboundTabListPacket, () => {
      pass("TabList received");
    });

    conn.onPacket(play.ClientboundMoveEntityPosPacket, () => {
      pass("MoveEntityPos received");
    });

    conn.onPacket(play.ClientboundMoveEntityPosRotPacket, () => {
      pass("MoveEntityPosRot received");
    });

    conn.onPacket(play.ClientboundMoveEntityRotPacket, () => {
      pass("MoveEntityRot received");
    });

    conn.onPacket(play.ClientboundMoveVehiclePacket, () => {
      pass("MoveVehicle received");
    });

    conn.onPacket(play.ClientboundTeleportEntityPacket, () => {
      pass("TeleportEntity received");
    });

    conn.onPacket(play.ClientboundRotateHeadPacket, () => {
      pass("RotateHead received");
    });

    conn.onPacket(play.ClientboundSetEntityMotionPacket, () => {
      pass("SetEntityMotion received");
    });

    conn.onPacket(play.ClientboundSetEntityLinkPacket, () => {
      pass("SetEntityLink received");
    });

    conn.onPacket(play.ClientboundPingPacket, () => {
      pass("Ping received");
    });

    conn.onPacket(play.ClientboundPlaceGhostRecipePacket, () => {
      pass("PlaceGhostRecipe received");
    });

    conn.onPacket(play.ClientboundPongResponsePacket, () => {
      pass("PongResponse received");
    });

    conn.onPacket(play.ClientboundProjectilePowerPacket, () => {
      pass("ProjectilePower received");
    });

    conn.onPacket(play.ClientboundSetBorderCenterPacket, () => {
      pass("SetBorderCenter received");
    });

    conn.onPacket(play.ClientboundSetBorderLerpSizePacket, () => {
      pass("SetBorderLerpSize received");
    });

    conn.onPacket(play.ClientboundSetBorderSizePacket, () => {
      pass("SetBorderSize received");
    });

    conn.onPacket(play.ClientboundSetBorderWarningDelayPacket, () => {
      pass("SetBorderWarningDelay received");
    });

    conn.onPacket(play.ClientboundSetBorderWarningDistancePacket, () => {
      pass("SetBorderWarningDistance received");
    });

    conn.onPacket(play.ClientboundSetCursorItemPacket, () => {
      pass("SetCursorItem received");
    });

    conn.onPacket(play.ClientboundDebugSamplePacket, () => {
      pass("DebugSample received");
    });

    conn.onPacket(play.ClientboundDeleteChatPacket, () => {
      pass("DeleteChat received");
    });

    conn.onPacket(play.ClientboundDisguisedChatPacket, () => {
      pass("DisguisedChat received");
    });

    conn.onPacket(play.ClientboundEntityEventPacket, () => {
      pass("EntityEvent received");
    });

    conn.onPacket(play.ClientboundEntityPositionSyncPacket, () => {
      pass("EntityPositionSync received");
    });

    conn.onPacket(play.ClientboundExplodePacket, () => {
      pass("Explode received");
    });

    conn.onPacket(play.ClientboundForgetLevelChunkPacket, () => {
      pass("ForgetLevelChunk received");
    });

    conn.onPacket(play.ClientboundGameRuleValuesPacket, () => {
      pass("GameRuleValues received");
    });

    conn.onPacket(play.ClientboundLevelEventPacket, () => {
      pass("LevelEvent received");
    });

    conn.onPacket(play.ClientboundLowDiskSpaceWarningPacket, () => {
      pass("LowDiskSpaceWarning received");
    });

    conn.onPacket(play.ClientboundMountScreenOpenPacket, () => {
      pass("MountScreenOpen received");
    });

    conn.onPacket(play.ClientboundOpenBookPacket, () => {
      pass("OpenBook received");
    });

    conn.onPacket(play.ClientboundOpenSignEditorPacket, () => {
      pass("OpenSignEditor received");
    });

    conn.onPacket(play.ClientboundPlayerChatPacket, () => {
      pass("PlayerChat received");
    });

    conn.onPacket(play.ClientboundPlayerCombatEndPacket, () => {
      pass("PlayerCombatEnd received");
    });

    conn.onPacket(play.ClientboundPlayerCombatEnterPacket, () => {
      pass("PlayerCombatEnter received");
    });

    conn.onPacket(play.ClientboundPlayerCombatKillPacket, () => {
      pass("PlayerCombatKill received");
    });

    conn.onPacket(play.ClientboundPlayerLookAtPacket, () => {
      pass("PlayerLookAt received");
    });

    conn.onPacket(play.ClientboundPlayerRotationPacket, () => {
      pass("PlayerRotation received");
    });

    conn.onPacket(play.ClientboundResourcePackPopPacket, () => {
      pass("ResourcePackPop received");
    });

    conn.onPacket(play.ClientboundSelectAdvancementsTabPacket, () => {
      pass("SelectAdvancementsTab received");
    });

    conn.onPacket(play.ClientboundSetPlayerInventoryPacket, () => {
      pass("SetPlayerInventory received");
    });

    conn.onPacket(play.ClientboundStoreCookiePacket, () => {
      pass("StoreCookie received");
    });

    conn.onPacket(play.ClientboundStopSoundPacket, () => {
      pass("StopSound received");
    });

    conn.onPacket(play.ClientboundTagQueryPacket, () => {
      pass("TagQuery received");
    });

    conn.onPacket(play.ClientboundTickingStatePacket, () => {
      pass("TickingState received");
    });

    conn.onPacket(play.ClientboundTickingStepPacket, () => {
      pass("TickingStep received");
    });

    conn.onPacket(play.ClientboundTransferPacket, () => {
      pass("Transfer received");
    });

    conn.onPacket(play.ClientboundBundleDelimiterPacket, () => {
      pass("BundleDelimiter received");
    });

    conn.onPacket(play.ClientboundCookieRequestPacket, () => {
      pass("CookieRequest received");
    });

    conn.onPacket(play.ClientboundCustomPayloadPacket, () => {
      pass("Play CustomPayload received");
    });

    conn.onPacket(play.ClientboundCustomReportDetailsPacket, () => {
      pass("CustomReportDetails received");
    });

    conn.onPacket(play.ClientboundClearDialogPacket, () => {
      pass("ClearDialog received");
    });

    conn.onPacket(play.ClientboundShowDialogPacket, () => {
      pass("ShowDialog received");
    });

    conn.onPacket(play.ClientboundStartConfigurationPacket, () => {
      pass("StartConfiguration received");
    });

    conn.onPacket(play.ClientboundWaypointPacket, () => {
      pass("Waypoint received");
    });

    conn.onPacket(play.ClientboundServerLinksPacket, () => {
      pass("Play ServerLinks received");
    });

    conn.onPacket(play.ClientboundChunksBiomesPacket, () => {
      pass("ChunksBiomes received");
    });

    // After entering play, wait a bit then do some actions
    conn.onPacket(play.ClientboundLoginPacket, () => {
      setTimeout(() => {
        console.log("\nPerforming bot actions...");
        conn.write(new play.ServerboundClientTickEndPacket());

        setTimeout(() => {
          conn.write(new play.ServerboundChatPacket(
            "Hello from dripleaf!",
            { seconds: BigInt(Math.floor(Date.now() / 1000)) }, 0n, null,
            { offset: 0, acknowledged: new Uint8Array(3), checksum: 0 },
          ));
        }, 500);

        setTimeout(() => {
          conn.write(new play.ServerboundMovePlayerPosPacket(1.5, 64.0, 1.5, false, false));
        }, 1000);

        setTimeout(() => {
          conn.write(new play.ServerboundMovePlayerPosPacket(3.0, 64.0, 3.0, false, false));
        }, 1500);

        setTimeout(() => {
          conn.write(new play.ServerboundSetCarriedItemPacket(0));
        }, 2000);

        setTimeout(() => {
          console.log("\nDisconnecting...");
          printSummary();
          conn.disconnect();
        }, 3000);
      }, 2000);
    });

    // Send handshake
    conn.write(new handshake.ServerboundIntentionPacket(775, HOST, PORT, ClientIntention.Login));
    conn.setState(State.Login);
    conn.write(new login.ServerboundHelloPacket("DripleafBot", randomUUID() as UUID));
    console.log("Handshake + LoginStart sent");
  });

  socket.on("error", (err) => {
    console.error(`Socket error: ${err.message}`);
    process.exit(1);
  });

  socket.setTimeout(60000);
  socket.on("timeout", () => {
    console.error("Socket timeout");
    printSummary();
    process.exit(1);
  });
}

function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("INTEGRATION TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failedPackets.length > 0) {
    console.log("\nFailed packets:");
    for (const pkt of failedPackets) console.log(`  - ${pkt}`);
  }
  console.log("\nAll received packets:");
  const sorted = [...decodedPackets.entries()].sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sorted) console.log(`  ${name.padEnd(55)} x${count}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
