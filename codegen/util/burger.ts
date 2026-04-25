export async function getBurgerData(jar: string) {
  console.log(`Generating burger data for ${jar}...`);
  const proc = Bun.spawn({
    cmd: ["uv", "run", "munch.py", "../../" + jar, "--output", "../../tmp/output.json"],
    cwd: "codegen/azalea-burger",
  });

  await proc.exited;
  if (proc.exitCode != 0) {
    throw new Error(`Code generation failed with exit code ${proc.exitCode}`);
  }

  const outputFile = Bun.file("tmp/output.json");
  if (!outputFile.exists()) throw new Error("Output file does not exist. Please run the code generation script first.");

  const output = await outputFile.json() as any[];
  if (!Array.isArray(output) || output.length == 0) throw new Error("Output file is not in the expected format (array) or is empty.");
  return output[0];
}