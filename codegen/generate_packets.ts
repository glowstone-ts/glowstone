import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { downloadServerJar, getReport } from "./util/download";
import {
  identifierToPath,
  toPascalCase,
  toSnakeCase,
  upperCaseFirst
} from "./util/misc";
import { getGeneratedHeader } from "./util/generated";
import { rm } from "node:fs/promises";

const shouldWipe = process.argv.includes("--wipe");
if (shouldWipe) console.log("Wiping existing packet files...");

const VERSION = "26.1";
const serverJar = await downloadServerJar("generated", VERSION);

const packetsReport = await getReport(serverJar, "packets");

const PACKETS_DIR_PATH = "packages/protocol/src/packets";

const stateImports = [];
const clientboundPackets = [];
const serverboundPackets = [];

for (const state in packetsReport) {
  const STATE_DIR_PATH = path.join(PACKETS_DIR_PATH, state);

  if (existsSync(STATE_DIR_PATH) && shouldWipe) await rm(STATE_DIR_PATH, { recursive: true });
  if (!existsSync(STATE_DIR_PATH)) await mkdir(STATE_DIR_PATH, { recursive: true });

  const stateIndexOutput = [getGeneratedHeader(path.relative(process.cwd(), import.meta.path))];

  for (const side in packetsReport[state]) {
    for (const packetName in packetsReport[state][side]) {
      const packetPathPart = identifierToPath(packetName)!;

      const fileStem = `${side[0]!.toLowerCase()}_${toSnakeCase(packetPathPart)}_packet`;

      const packetFilePath = path.join(STATE_DIR_PATH, `${fileStem}.ts`);

      const packetClassName = `${upperCaseFirst(side)}${toPascalCase(packetPathPart)}Packet`;

      const protocolId = packetsReport[state][side][packetName].protocol_id;

      if (!existsSync(packetFilePath)) {
        const output = [
          getGeneratedHeader(path.relative(process.cwd(), import.meta.path)),
          "import { Direction, State } from '../../types';",
          "import { DripleafPacket } from '../DripleafPacket';",
          "import { PacketReader, PacketWriter } from '../../buffer';",
          "",
          `export class ${packetClassName} extends DripleafPacket {`,
          `\tstatic readonly id = 0x${protocolId.toString(16).padStart(2, "0")};`,
          `\tstatic readonly state = State.${upperCaseFirst(state)};`,
          `\tstatic readonly direction = Direction.${upperCaseFirst(side)};`,
          "",
          `\toverride readonly id = ${packetClassName}.id;`,
          `\toverride readonly state = ${packetClassName}.state;`,
          `\toverride readonly direction = ${packetClassName}.direction;`,
          "",
          "\tconstructor(",
          "\t\t// todo",
          "\t) {",
          "\t\tsuper();",
          "\t}",
          "",
          "\twrite(writer: PacketWriter) {",
          "\t\t// todo",
          "\t}",
          "",
          `\tstatic read(reader: PacketReader): ${packetClassName} {`,
          "\t\t// todo",
          "\t}",
          "}",
        ];

        await Bun.write(packetFilePath, output.join("\n"));

        console.log(`Generated packet ${packetClassName} in state ${state} (${side}) with protocol id ${protocolId}`);
      }

      stateIndexOutput.push(`export * from './${fileStem}';`);

      if (side === "clientbound") {
        clientboundPackets.push(`\t${state}.${packetClassName},`);
      } else {
        serverboundPackets.push(`\t${state}.${packetClassName},`);
      }
    }
  }

  await Bun.write(path.join(STATE_DIR_PATH, "index.ts"),stateIndexOutput.join("\n"));

  stateImports.push(`import * as ${state} from './${state}';`);
}

const rootIndexOutput = [
  getGeneratedHeader(path.relative(process.cwd(), import.meta.path)),
  "import { PacketRegistry, type PacketConstructor } from '../registry/PacketRegistry';",
  "",
  ...stateImports,
  "",
  "const serverboundPackets: PacketConstructor[] = [",
  ...serverboundPackets,
  "];",
  "",
  "const clientboundPackets: PacketConstructor[] = [",
  ...clientboundPackets,
  "];",
  "",
  "const packetRegistry = new PacketRegistry();",
  "",
  "for (const packet of [...serverboundPackets, ...clientboundPackets])",
  "\tpacketRegistry.register(packet);",
  "",
  `export { packetRegistry, serverboundPackets, clientboundPackets, ${Object.keys(packetsReport).join(", ")} };`
];

await Bun.write(path.join(PACKETS_DIR_PATH, "index.ts"), rootIndexOutput.join("\n"));
