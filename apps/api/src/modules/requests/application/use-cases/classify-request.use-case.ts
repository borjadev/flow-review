import { NotFoundError } from '../../../../shared/application/application-error.js';
import type { Clock } from '../../../../shared/application/clock.js';
import type { RequestDetailsView } from '../dto/views.js';
import type { RequestRepository } from '../ports/repositories.js';
import type { ClassificationRunner } from '../services/classification-runner.js';
import type { RequestDetailsAssembler } from '../services/request-details-assembler.js';

export interface ClassifyRequestCommand {
  requestId: string;
  actorId: string;
}

/**
 * Runs the FIRST classification of a SUBMITTED request. Invalid state (e.g. a
 * request already awaiting review) surfaces as a domain InvalidStateTransition
 * error, which the HTTP layer maps to 409.
 */
export class ClassifyRequestUseCase {
  constructor(
    private readonly requests: RequestRepository,
    private readonly runner: ClassificationRunner,
    private readonly assembler: RequestDetailsAssembler,
    private readonly clock: Clock,
  ) {}

  async execute(command: ClassifyRequestCommand): Promise<RequestDetailsView> {
    const request = await this.requests.findById(command.requestId);
    if (!request) {
      throw new NotFoundError('SupportRequest', command.requestId);
    }

    request.startClassification(command.actorId, this.clock.now());
    await this.runner.run(request, command.actorId);

    return this.assembler.assemble(command.requestId);
  }
}
