import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { cp } from "node:fs/promises";
import { mkdir } from "node:fs/promises";

const VERSION_MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

type VersionManifest = {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: {
    id: string;
    type: 'release' | 'snapshot' | 'old_alpha' | 'old_beta';
    url: string;
    time: string;
    releaseTime: string;
    sha1: string;
    complianceLevel: number;
  }[];
};

export async function getVersionManifest() {
  const response = await fetch(VERSION_MANIFEST);
  if (!response.ok) {
    throw new Error(`Failed to download version manifest: ${response.status} ${response.statusText}`);
  }
  return await response.json() as VersionManifest;
}

export async function getVersionMeta(version: string) {
  const manifest = await getVersionManifest();
  const versionInfo = manifest.versions.find(v => v.id === version);
  if (!versionInfo) {
    throw new Error(`Version ${version} not found in manifest`);
  }
  const response = await fetch(versionInfo.url);
  if (!response.ok) {
    throw new Error(`Failed to download version metadata for ${version}: ${response.status} ${response.statusText}`);
  }
  return await response.json() as any;
}

export async function downloadClientJar(path: string, version: string) {
  const filename = `${path}/client-${version}.jar`;
  if (!await Bun.file(filename).exists()) {
    const meta = await getVersionMeta(version);
    const url = meta.downloads.client.url;
    const res = await fetch(url);
    const data = await res.arrayBuffer()
    await Bun.write(filename, data);
  }
  return filename;
}

export async function downloadServerJar(path: string, version: string) {
  const filename = `${path}/server-${version}.jar`;
  if (!await Bun.file(filename).exists()) {
    const meta = await getVersionMeta(version);
    const url = meta.downloads.server.url;
    const res = await fetch(url);
    const data = await res.arrayBuffer()
    await Bun.write(filename, data);
  }
  return filename;
}

export async function generateDataFromServerJar(jar: string) {
  if (!await Bun.file(jar).exists()) {
    throw new Error(`Server jar ${jar} does not exist`);
  }
  if (existsSync("tmp")) await rm("tmp", { recursive: true });
  await mkdir("tmp");

  await cp(jar, "tmp/server.jar", { force: true });

  const process = Bun.spawn({
    cmd: ["java", "-DbundlerMainClass=net.minecraft.data.Main", "-jar", "server.jar", "--all"],
    cwd: "tmp"
  });

  const code = await process.exited;
  if (code !== 0) {
    throw new Error(`Data generation process exited with code ${code}`);
  }

  await cp("tmp/generated/data", "generated/data", { recursive: true, force: true });
  await cp("tmp/generated/reports", "generated/reports", { recursive: true, force: true });
  await rm("tmp", { recursive: true });
}

export async function getReport(jar: string, name: string) {
  await generateDataFromServerJar(jar);
  const reportFile = Bun.file(`generated/reports/${name}.json`);
  return await reportFile.json();
}