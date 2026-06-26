import { Router } from 'express';
import { createRequestSchema, listRequestsQuerySchema, reviewRequestSchema } from '@flow-review/contracts';
import type { AppContainer } from '../../../../container.js';
import { asyncHandler } from '../../../../shared/presentation/http/async-handler.js';
import { requireActor } from '../../../../shared/presentation/http/actor.js';
import { requireParam } from '../../../../shared/presentation/http/params.js';
import type { ReviewRequestCommand } from '../../application/use-cases/review-request-classification.use-case.js';

export function createRequestRouter(container: AppContainer): Router {
  const router = Router();

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = createRequestSchema.parse(req.body);
      const actorId = requireActor(req);
      const view = await container.createRequest.execute({ ...body, actorId });
      res.status(201).json(view);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = listRequestsQuerySchema.parse(req.query);
      const view = await container.listRequests.execute(query);
      res.json(view);
    }),
  );

  router.get(
    '/:requestId',
    asyncHandler(async (req, res) => {
      const view = await container.getRequestDetails.execute({
        requestId: requireParam(req, 'requestId'),
      });
      res.json(view);
    }),
  );

  router.post(
    '/:requestId/classify',
    asyncHandler(async (req, res) => {
      const actorId = requireActor(req);
      const view = await container.classifyRequest.execute({
        requestId: requireParam(req, 'requestId'),
        actorId,
      });
      res.json(view);
    }),
  );

  router.post(
    '/:requestId/retry',
    asyncHandler(async (req, res) => {
      const actorId = requireActor(req);
      const view = await container.retryRequestClassification.execute({
        requestId: requireParam(req, 'requestId'),
        actorId,
      });
      res.json(view);
    }),
  );

  router.post(
    '/:requestId/review',
    asyncHandler(async (req, res) => {
      const body = reviewRequestSchema.parse(req.body);
      const actorId = requireActor(req);
      const requestId = requireParam(req, 'requestId');

      const command: ReviewRequestCommand =
        body.decision === 'APPROVED'
          ? {
              requestId,
              reviewerId: actorId,
              decision: 'APPROVED',
              ...(body.comment !== undefined ? { comment: body.comment } : {}),
              ...(body.classification ? { corrections: body.classification } : {}),
            }
          : {
              requestId,
              reviewerId: actorId,
              decision: 'REJECTED',
              comment: body.comment,
            };

      const view = await container.reviewRequestClassification.execute(command);
      res.json(view);
    }),
  );

  router.get(
    '/:requestId/audit-log',
    asyncHandler(async (req, res) => {
      const view = await container.getRequestAuditLog.execute({
        requestId: requireParam(req, 'requestId'),
      });
      res.json(view);
    }),
  );

  return router;
}
