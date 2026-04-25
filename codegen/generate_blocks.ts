import { GENERATED_HEADER } from "./constants";
import { getBurgerData } from "./util/burger";
import { downloadClientJar } from "./util/download";
const blocksFile = Bun.file("packages/registry/src/blocks.ts");
const outputs = [GENERATED_HEADER];

const clientJar = await Bun.file("tmp/client-26.1.jar").exists() ? "tmp/client-26.1.jar" : await downloadClientJar("tmp", "26.1");
const burgerData = await getBurgerData(clientJar);

outputs.push('enum Block {');
for (const block of Object.entries(burgerData.blocks.block_fields)) {
  const blockName = block[0];
  const blockId = block[1];
  outputs.push(`  ${blockName} = "${blockId}",`);
}
outputs.push('}');
outputs.push('');

const blocks: Record<string, any> = {};
for (const block of Object.values(burgerData.blocks.block) as any[]) {
  delete block.class;
  delete block.field;
  delete block.super;
  const textId = block.text_id;
  delete block.text_id;
  block.id = block.numeric_id;
  delete block.numeric_id;
  blocks[textId] = block;
}

outputs.push('const blocks = ' + JSON.stringify(blocks, null, 2) + ';');

outputs.push('export { Block, blocks };');

await Bun.write(blocksFile, outputs.join('\n'));
console.log(`Generated blocks.ts`);