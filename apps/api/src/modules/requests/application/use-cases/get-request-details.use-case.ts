import type { RequestDetailsView } from '../dto/views.js';
import type { RequestDetailsAssembler } from '../services/request-details-assembler.js';

export interface GetRequestDetailsQuery {
  requestId: string;
}

export class GetRequestDetailsUseCase {
  constructor(private readonly assembler: RequestDetailsAssembler) {}

  execute(query: GetRequestDetailsQuery): Promise<RequestDetailsView> {
    return this.assembler.assemble(query.requestId);
  }
}
