const os = require("node:os");
const { spawn } = require("node:child_process");

process.env.NEXT_DIST_DIR = process.env.NEXT_DIST_DIR || ".next-dev";
process.env.ZENVY_DEV_URL = process.env.ZENVY_DEV_URL || "http://localhost:3000";

require("./prepare-devtools-config");

function getLanIp() {
  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    if (!addresses) {
      continue;
    }

    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }

  return "127.0.0.1";
}

const port = "3000";
const lanIp = getLanIp();
const browserUrl = `http://${lanIp}:${port}`;

console.log(`Frontend URL: ${browserUrl}`);

const nextBin = require.resolve("next/dist/bin/next");
const nextDev = spawn(process.execPath, [nextBin, "dev", "--hostname", "0.0.0.0", "--port", port], {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

function rewriteNextOutput(stream, target) {
  let buffer = "";

  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.includes("Local:")) {
        target.write(`   - Browser:      ${browserUrl}\n`);
        continue;
      }

      if (line.includes("Network:")) {
        continue;
      }

      target.write(`${line}\n`);
    }
  });

  stream.on("end", () => {
    if (!buffer) {
      return;
    }

    if (buffer.includes("Local:")) {
      target.write(`   - Browser:      ${browserUrl}\n`);
      return;
    }

    if (!buffer.includes("Network:")) {
      target.write(buffer);
    }
  });
}

rewriteNextOutput(nextDev.stdout, process.stdout);
rewriteNextOutput(nextDev.stderr, process.stderr);

process.on("SIGINT", () => {
  nextDev.kill("SIGINT");
});

process.on("SIGTERM", () => {
  nextDev.kill("SIGTERM");
});

nextDev.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
