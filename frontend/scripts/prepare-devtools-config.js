const fs = require("node:fs");
const path = require("node:path");

const distDir = process.env.NEXT_DIST_DIR || ".next-dev";
const configPath = path.join(process.cwd(), distDir, "cache", "next-devtools-config.json");

function loadExistingConfig(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

fs.mkdirSync(path.dirname(configPath), { recursive: true });

const currentConfig = loadExistingConfig(configPath);
const nextConfig = {
  ...currentConfig,
  disableDevIndicator: true,
};

fs.writeFileSync(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");
