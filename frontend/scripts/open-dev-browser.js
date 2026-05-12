const http = require("node:http");
const https = require("node:https");
const { exec } = require("node:child_process");

const targetUrl = process.env.ZENVY_DEV_URL || "http://localhost:3000";
const timeoutMs = 120_000;
const pollIntervalMs = 800;

function requestText(url) {
  const client = url.startsWith("https://") ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        const redirectedUrl = new URL(response.headers.location, url).toString();
        response.resume();
        requestText(redirectedUrl).then(resolve).catch(reject);
        return;
      }

      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode || 0,
          body,
        });
      });
    });

    request.on("error", reject);
    request.setTimeout(5_000, () => {
      request.destroy(new Error("Timed out while waiting for dev server"));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStyledApp() {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const page = await requestText(targetUrl);
      if (page.statusCode === 200) {
        const cssMatch = page.body.match(/href="([^"]*\/_next\/static\/css\/app\/layout\.css[^"]*)"/i);

        if (cssMatch) {
          const cssUrl = new URL(cssMatch[1], targetUrl).toString();
          const css = await requestText(cssUrl);

          if (
            css.statusCode === 200 &&
            (css.body.includes(".section-shell") || css.body.includes("tailwindcss"))
          ) {
            exec(`cmd /c start "" "${targetUrl}"`);
            return;
          }
        }
      }
    } catch {
      // The dev server is still warming up. Keep polling quietly.
    }

    await sleep(pollIntervalMs);
  }
}

waitForStyledApp().catch(() => {
  // Avoid failing the main dev process if the auto-open helper exits early.
});
