import path from "node:path";
import { getBurgerData } from "./util/burger";
import { downloadClientJar, downloadServerJar, generateDataFromServerJar } from "./util/download";
import { getGeneratedHeader } from "./util/generated";
import { toPascalCase } from "./util/misc";

const builtinFile = Bun.file("packages/registry/src/builtin.ts");
const outputs = [getGeneratedHeader(path.relative(process.cwd(), import.meta.path))];

const serverJar = await downloadServerJar("generated", "26.1");
await generateDataFromServerJar(serverJar);

const registriesReportFile = Bun.file("generated/reports/registries.json");
if (!await registriesReportFile.exists()) throw new Error("Registries report not found, please try again.");
const registriesReport = await registriesReportFile.json();

const enumClasses = [];

for (const [registryId, registry] of Object.entries(registriesReport) as [string, any][]) {
  const registryName = registryNameToEnumName(registryId.replace("minecraft:", ""));
  console.log(`Generating registry: ${registryName}`);
  enumClasses.push(registryName);
  outputs.push(`enum ${registryName} {`);
  for (const [identifier] of Object.entries(registry.entries) as [string, { protocol_id: number }][]) {
    const path = identifier.replace("minecraft:", "");
    outputs.push(`  ${toPascalCase(path)} = "${path}",`);
  }
  outputs.push(`}`);
  outputs.push("");
}
outputs.push(`export { ${enumClasses.join(", ")} };`);

await Bun.write(builtinFile, outputs.join('\n'));
console.log(`Generated builtin.ts`);

function registryNameToEnumName(registryName: string) {
  switch (registryName) {
    case "block_type": 
      registryName = "abstract_" + registryName;
      break;
    case "menu":
    case "block":
    case "item":
      registryName += "_type";
      break;
    default:
      break;
  }

  return toPascalCase(registryName);
}