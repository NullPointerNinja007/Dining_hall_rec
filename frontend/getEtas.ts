type LatLon = {
  lat: number;
  lon: number;
};

export type EtaResult = {
  hall: string;
  distance_km: number;
  walk_min: number;
  bike_min: number;
};

type EtaResponse = {
  data: EtaResult[];
  status: number;
};

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function getCurrentPosition(): Promise<GeolocationPosition> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("geolocation_unavailable"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

async function postEtas(origin: LatLon): Promise<EtaResult[]> {
  const response = await fetch("/api/etas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ origin }),
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ error: "unknown_error" }));
    const errorMessage =
      typeof errorPayload?.error === "string"
        ? errorPayload.error
        : `request_failed_${response.status}`;
    throw new Error(errorMessage);
  }

  const etas = (await response.json()) as EtaResult[];
  return etas;
}

export async function getEtas(): Promise<EtaResult[]> {
  const position = await getCurrentPosition();
  const origin: LatLon = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };

  return postEtas(origin);
}

export async function getEtasWithStatus(): Promise<EtaResponse> {
  try {
    const data = await getEtas();
    return { data, status: 200 };
  } catch (error) {
    return {
      data: [],
      status: error instanceof Error ? 500 : 520,
    };
  }
}

