import * as express from 'express';
import { createNetWork } from '@cellularjs/net';
import { getLogger } from '@cellularjs/logger';
import { env } from '$share/env';
import { netCnfs } from '$share/net';
import { configRoutes } from './routes';

(async () => {
  const logger = getLogger('HTTP App');

  try {
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.disable('x-powered-by');

    configRoutes(app);

    await createNetWork(netCnfs);

    const port = env().NODE_PORT;

    app.listen(port, () => logger.info(`ready for HTTP request (port: ${port})`));
  } catch (err) {
    logger.error(`failed to initialize\n${err}`);
  }
})();
