import { readdir } from "node:fs/promises";
import path from "node:path";

const BASE_DIR = "generated/data/minecraft";

export async function getDataRegistries() {
  const registries: Record<string, string[]> = {};

  async function addEntriesInDir(registryPath: string) {
    try {
      const dir = path.join(BASE_DIR, registryPath);
      const files = await readdir(dir);

      const entries = files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.slice(0, -5));

      if (entries.length) {
        registries[registryPath] = entries;
      }
    } catch {}
  }

  let baseEntries: string[] = [];
  try {
    baseEntries = await readdir(BASE_DIR);
  } catch {
    return registries;
  }

  await Promise.all(
    baseEntries.map((name) => addEntriesInDir(name))
  );

  await addEntriesInDir(path.join("worldgen", "biome"));

  return registries;
}