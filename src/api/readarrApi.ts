import type { ArrApp } from './types';
import ArrApiBase from './arrApiBase';

export class ReadarrApi extends ArrApiBase {
  constructor(app: ArrApp) {
    super(app);
  }
}

export default ReadarrApi;

