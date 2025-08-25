import type { ArrApp } from './types';
import ArrApiBase from './arrApiBase';
import { SonarrApi } from './sonarrApi';
import { RadarrApi } from './radarrApi';

export function createArrApi(app: ArrApp & { type: 'sonarr' }): SonarrApi;
export function createArrApi(app: ArrApp & { type: 'radarr' }): RadarrApi;
export function createArrApi(app: ArrApp): ArrApiBase {
  switch (app.type) {
    case 'sonarr':
      return new SonarrApi(app);
    case 'radarr':
      return new RadarrApi(app);
    default:
      throw new Error(`Unsupported app type: ${app.type}`);
  }
}

export type { ArrApiBase, SonarrApi, RadarrApi };
