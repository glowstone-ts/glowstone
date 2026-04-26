import path from "node:path";
import { downloadServerJar, generateDataFromServerJar, getReport } from "./util/download";
import { getGeneratedHeader } from "./util/generated";
import { registryNameToEnumName, toPascalCase } from "./util/misc";

const builtinFile = Bun.file("packages/registry/src/builtin.ts");
const outputs = [getGeneratedHeader(path.relative(process.cwd(), import.meta.path))];

const serverJar = await downloadServerJar("generated", "26.1");
await generateDataFromServerJar(serverJar);

const registriesReport = await getReport(serverJar, "registries");
const enumClasses = [];

for (const [registryId, registry] of Object.entries(registriesReport) as [string, any][]) {
  const registryName = registryNameToEnumName(registryId.replace("minecraft:", ""));
  console.log(`Generating registry: ${registryName}`);
  enumClasses.push(registryName);
  outputs.push(`enum ${registryName} {`);
  for (const [identifier] of Object.entries(registry.entries) as [string, { protocol_id: number }][]) {
    const path = identifier.replace("minecraft:", "");
    outputs.push(`\t${toPascalCase(path)} = "${path}",`);
  }
  outputs.push(`}\n`);
}
outputs.push(`export { ${enumClasses.join(", ")} };`);

await Bun.write(builtinFile, outputs.join('\n'));
console.log(`Generated builtin.ts`);
