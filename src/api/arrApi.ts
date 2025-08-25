import type { ArrApp } from './types';
import ArrApiBase from './arrApiBase';
import { SonarrApi } from './sonarrApi';
import { RadarrApi } from './radarrApi';
import { LidarrApi } from './lidarrApi';
import { ReadarrApi } from './readarrApi';

export function createArrApi(app: ArrApp & { type: 'sonarr' }): SonarrApi;
export function createArrApi(app: ArrApp & { type: 'radarr' }): RadarrApi;
export function createArrApi(app: ArrApp & { type: 'lidarr' }): LidarrApi;
export function createArrApi(app: ArrApp & { type: 'readarr' }): ReadarrApi;
export function createArrApi(app: ArrApp): ArrApiBase {
  switch (app.type) {
    case 'sonarr':
      return new SonarrApi(app);
    case 'radarr':
      return new RadarrApi(app);
    case 'lidarr':
      return new LidarrApi(app);
    case 'readarr':
      return new ReadarrApi(app);
    default:
      throw new Error(`Unsupported app type: ${app.type}`);
  }
}

export type { ArrApiBase, SonarrApi, RadarrApi, LidarrApi, ReadarrApi };
