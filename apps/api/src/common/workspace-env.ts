import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

function collectAncestorDirs(startDir: string) {
  const dirs: string[] = [];
  const visited = new Set<string>();
  let currentDir = path.resolve(startDir);

  while (!visited.has(currentDir)) {
    visited.add(currentDir);
    dirs.push(currentDir);

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return dirs;
}

function findWorkspaceRoot(startDir: string) {
  for (const candidate of collectAncestorDirs(startDir)) {
    if (
      fs.existsSync(path.join(candidate, "package.json")) &&
      fs.existsSync(path.join(candidate, "apps", "api", "package.json"))
    ) {
      return candidate;
    }
  }

  return undefined;
}

export function loadWorkspaceEnv(startDir = process.cwd(), moduleDir?: string) {
  const searchDirs: string[] = [];
  const seen = new Set<string>();

  const workspaceRoot =
    (moduleDir ? findWorkspaceRoot(moduleDir) : undefined) ??
    findWorkspaceRoot(startDir);

  if (workspaceRoot) {
    searchDirs.push(path.join(workspaceRoot, "apps", "api"));
  }

  searchDirs.push(...collectAncestorDirs(startDir));

  if (moduleDir) {
    searchDirs.push(...collectAncestorDirs(moduleDir));
  }

  for (const currentDir of searchDirs) {
    if (seen.has(currentDir)) {
      continue;
    }

    seen.add(currentDir);

    for (const fileName of [".env.local", ".env"]) {
      const filePath = path.join(currentDir, fileName);

      if (fs.existsSync(filePath)) {
        dotenv.config({ path: filePath, override: false });
      }
    }
  }
}
