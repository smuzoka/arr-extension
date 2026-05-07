import type { ArrAppWithKey } from "./types";
import ArrApiBase from "./arrApiBase";
import { SonarrApi } from "./sonarrApi";
import { RadarrApi } from "./radarrApi";

export function createArrApi(app: ArrAppWithKey & { type: "sonarr" }): SonarrApi;
export function createArrApi(app: ArrAppWithKey & { type: "radarr" }): RadarrApi;
export function createArrApi(app: ArrAppWithKey): ArrApiBase {
  switch (app.type) {
    case "sonarr":
      return new SonarrApi(app);
    case "radarr":
      return new RadarrApi(app);
  }
}

export type { ArrApiBase, SonarrApi, RadarrApi };
