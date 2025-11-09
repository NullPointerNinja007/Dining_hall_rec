const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL, URLSearchParams } = require("url");

const GOOGLE_BASE_URL =
  "https://maps.googleapis.com/maps/api/distancematrix/json";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function applyCors(res) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
}

const DINING_HALLS = [
  {
    name: "Arrillaga Family Dining Commons",
    lat: 37.4254899164213,
    lon: -122.164203213491,
  },
  {
    name: "Branner Dining",
    lat: 37.4258450648514,
    lon: -122.1627032657454,
  },
  {
    name: "Florence Moore Dining",
    lat: 37.42226212615886,
    lon: -122.17179705029382,
  },
  {
    name: "Lakeside Dining",
    lat: 37.42467330589694,
    lon: -122.17633688795281,
  },
  {
    name: "Ricker Dining",
    lat: 37.425480437342756,
    lon: -122.18052942714579,
  },
  {
    name: "Stern Dining",
    lat: 37.424536020889356,
    lon: -122.1656459941451,
  },
  {
    name: "Wilbur Dining",
    lat: 37.42401672059748,
    lon: -122.16311743032858,
  },
];

function sendJson(res, statusCode, payload) {
  applyCors(res);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(payload));
}

function buildDestinations() {
  return DINING_HALLS.map((hall) => `${hall.lat},${hall.lon}`).join("|");
}

function buildMatrixUrl(origin, mode, apiKey) {
  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lon}`,
    destinations: buildDestinations(),
    mode,
    key: apiKey,
  });

  return `${GOOGLE_BASE_URL}?${params.toString()}`;
}

async function fetchMatrix(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`matrix_http_${response.status}`);
  }
  const data = await response.json();
  if (data.status !== "OK" || !Array.isArray(data.rows) || !data.rows[0]) {
    throw new Error("matrix_invalid_response");
  }
  return data.rows[0].elements || [];
}

function toMinutes(duration) {
  if (!duration || typeof duration.value !== "number") {
    return null;
  }
  return Math.round((duration.value / 60) * 10) / 10;
}

function toKilometers(distanceElement) {
  if (!distanceElement || typeof distanceElement.value !== "number") {
    return null;
  }
  return Math.round((distanceElement.value / 1000) * 100) / 100;
}

async function handleEtaRequest(origin, apiKey) {
  const [walkElements, bikeElements] = await Promise.all([
    fetchMatrix(buildMatrixUrl(origin, "walking", apiKey)),
    fetchMatrix(buildMatrixUrl(origin, "bicycling", apiKey)),
  ]);

  return DINING_HALLS.map((hall, index) => {
    const walkElement = walkElements[index] || {};
    const bikeElement = bikeElements[index] || {};
    const distanceKm =
      toKilometers(walkElement.distance) ??
      toKilometers(bikeElement.distance);
    const walkMinutes =
      walkElement.status === "OK" ? toMinutes(walkElement.duration) : null;
    const bikeMinutes =
      bikeElement.status === "OK" ? toMinutes(bikeElement.duration) : null;

    return {
      hall: hall.name,
      distance_km: distanceKm,
      walk_min: walkMinutes,
      bike_min: bikeMinutes,
    };
  });
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host}`);
  ensureGoogleMapsKey();

  if (req.method === "POST" && requestUrl.pathname === "/api/etas") {
    const apiKey = process.env.GOOGLE_MAPS_KEY;
    if (!apiKey) {
      sendJson(res, 500, { error: "missing_api_key" });
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy(new Error("payload_too_large"));
      }
    });

    req.on("error", (error) => {
      if (!res.headersSent) {
        sendJson(res, 400, {
          error: error.message || "request_error",
        });
      }
    });

    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const origin = parsed?.origin;
        if (
          !origin ||
          typeof origin.lat !== "number" ||
          typeof origin.lon !== "number"
        ) {
          sendJson(res, 400, { error: "invalid_origin" });
          return;
        }

        const results = await handleEtaRequest(origin, apiKey);
        sendJson(res, 200, results);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "unknown_error";
        if (!res.headersSent) {
          sendJson(res, 500, { error: message });
        } else {
          res.end();
        }
      }
    });
    return;
  }

  if (req.method === "OPTIONS" && requestUrl.pathname === "/api/etas") {
    applyCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  sendJson(res, 404, { error: "not_found" });
}

function ensureGoogleMapsKey() {
  if (process.env.GOOGLE_MAPS_KEY) {
    return;
  }
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  try {
    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().startsWith("#") || !line.includes("=")) {
        continue;
      }
      const [key, ...rest] = line.split("=");
      const value = rest.join("=").trim();
      const normalizedKey = key.trim();
      if (!process.env[normalizedKey]) {
        process.env[normalizedKey] = value;
      }
    }
  } catch {
    // ignore parse errors; missing key will be handled downstream
  }
}

function createEtaServer() {
  return http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : "unknown_error";
      if (!res.headersSent) {
        applyCors(res);
        res.writeHead(500, { "Content-Type": "application/json" });
      }
      res.end(JSON.stringify({ error: message }));
    });
  });
}

module.exports = {
  createEtaServer,
  handleEtaRequest,
  DINING_HALLS,
};

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const server = createEtaServer();
  server.listen(port, () => {
    console.log(`ETA server listening on port ${port}`);
  });
}

