import { useNavigate } from 'react-router-dom';
import type { CreateRequestBody } from '@flow-review/contracts';
import { useCreateRequest } from '../../shared/api/hooks';
import { CreateRequestForm } from './CreateRequestForm';

export function CreateRequestPage() {
  const navigate = useNavigate();
  const mutation = useCreateRequest();

  const handleSubmit = (values: CreateRequestBody) => {
    mutation.mutate(values, {
      onSuccess: (request) => {
        navigate(`/requests/${request.id}`);
      },
    });
  };

  return (
    <section className="page page--narrow">
      <header className="page__header">
        <div>
          <h1 className="page__title">New support request</h1>
          <p className="page__subtitle">
            Create a request, then run AI classification for human review.
          </p>
        </div>
      </header>

      <CreateRequestForm
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        submitError={mutation.isError ? mutation.error.message : undefined}
      />
    </section>
  );
}
