import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createRequestSchema, type CreateRequestBody } from '@flow-review/contracts';
import { Field } from '../../shared/components/Field';
import { Button } from '../../shared/components/Button';

interface CreateRequestFormProps {
  onSubmit: (values: CreateRequestBody) => void;
  isSubmitting: boolean;
  submitError?: string;
}

export function CreateRequestForm({
  onSubmit,
  isSubmitting,
  submitError,
}: CreateRequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRequestBody>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      requesterName: '',
      requesterEmail: '',
      subject: '',
      description: '',
    },
  });

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field id="requesterName" label="Requester name" error={errors.requesterName?.message}>
        <input id="requesterName" type="text" {...register('requesterName')} />
      </Field>

      <Field id="requesterEmail" label="Requester email" error={errors.requesterEmail?.message}>
        <input id="requesterEmail" type="email" {...register('requesterEmail')} />
      </Field>

      <Field id="subject" label="Subject" error={errors.subject?.message}>
        <input id="subject" type="text" {...register('subject')} />
      </Field>

      <Field id="description" label="Description" error={errors.description?.message}>
        <textarea id="description" rows={6} {...register('description')} />
      </Field>

      {submitError !== undefined && (
        <p className="form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Create request'}
        </Button>
      </div>
    </form>
  );
}
