import { NotFoundError } from '../../../../shared/application/application-error.js';
import type { Clock } from '../../../../shared/application/clock.js';
import type { RequestDetailsView } from '../dto/views.js';
import type { RequestRepository } from '../ports/repositories.js';
import type { ClassificationRunner } from '../services/classification-runner.js';
import type { RequestDetailsAssembler } from '../services/request-details-assembler.js';

export interface RetryRequestClassificationCommand {
  requestId: string;
  actorId: string;
}

/**
 * Re-runs classification for a REJECTED or CLASSIFICATION_FAILED request. The
 * aggregate enforces that only those states may retry (otherwise 409).
 */
export class RetryRequestClassificationUseCase {
  constructor(
    private readonly requests: RequestRepository,
    private readonly runner: ClassificationRunner,
    private readonly assembler: RequestDetailsAssembler,
    private readonly clock: Clock,
  ) {}

  async execute(command: RetryRequestClassificationCommand): Promise<RequestDetailsView> {
    const request = await this.requests.findById(command.requestId);
    if (!request) {
      throw new NotFoundError('SupportRequest', command.requestId);
    }

    request.retryClassification(command.actorId, this.clock.now());
    await this.runner.run(request, command.actorId);

    return this.assembler.assemble(command.requestId);
  }
}
