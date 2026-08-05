import { cp, mkdir, access } from "node:fs/promises";
import path from "node:path";

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectory(source, destination) {
  if (!(await exists(source))) {
    console.log(`ℹ️ Asset directory not present: ${source}`);
    return;
  }

  await mkdir(destination, {
    recursive: true
  });

  await cp(source, destination, {
    recursive: true,
    force: true
  });
}

await copyDirectory(
  path.resolve("src", "agent-skills"),
  path.resolve("dist", "agent-skills")
);

await copyDirectory(
  path.resolve("src", "agent-workflows"),
  path.resolve("dist", "agent-workflows")
);

console.log("✅ Agent assets copied to dist.");