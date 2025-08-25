import type { ArrApp } from './types';
import ArrApiBase from './arrApiBase';

export class LidarrApi extends ArrApiBase {
  constructor(app: ArrApp) {
    super(app);
  }
}

export default LidarrApi;

