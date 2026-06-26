import type { Clock } from '../../../../shared/application/clock.js';
import type { IdGenerator } from '../../../../shared/application/id-generator.js';
import { SupportRequest } from '../../domain/entities/support-request.js';
import type { RequestDetailsView } from '../dto/views.js';
import type { UnitOfWork } from '../ports/unit-of-work.js';
import type { AuditTrailRecorder } from '../services/audit-trail-recorder.js';
import type { RequestDetailsAssembler } from '../services/request-details-assembler.js';

export interface CreateRequestCommand {
  requesterName: string;
  requesterEmail: string;
  subject: string;
  description: string;
  actorId: string;
}

export class CreateRequestUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly auditTrail: AuditTrailRecorder,
    private readonly assembler: RequestDetailsAssembler,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(command: CreateRequestCommand): Promise<RequestDetailsView> {
    const now = this.clock.now();
    const id = this.ids.next();

    const request = SupportRequest.create(
      {
        requesterName: command.requesterName,
        requesterEmail: command.requesterEmail,
        subject: command.subject,
        description: command.description,
        createdBy: command.actorId,
      },
      id,
      now,
    );

    await this.unitOfWork.run(async (repos) => {
      await repos.requests.save(request);
      await this.auditTrail.recordAll(request.pullDomainEvents(), repos.audit);
    });

    return this.assembler.assemble(id);
  }
}
