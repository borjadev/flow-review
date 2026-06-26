import { Router } from 'express';
import type { AppContainer } from '../../../../container.js';
import { asyncHandler } from '../../../../shared/presentation/http/async-handler.js';

export function createUserRouter(container: AppContainer): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const users = await container.listDemoUsers.execute();
      res.json(users);
    }),
  );

  return router;
}
