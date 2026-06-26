import { useState } from 'react';
import {
  CATEGORY_VALUES,
  DEPARTMENT_VALUES,
  PRIORITY_VALUES,
  reviewRequestSchema,
  type ClassificationCorrection,
  type ClassificationDto,
  type ReviewRequestBody,
} from '@flow-review/contracts';
import { Field } from '../../shared/components/Field';
import { Button } from '../../shared/components/Button';
import {
  categoryLabel,
  departmentLabel,
  priorityLabel,
} from '../../entities/request/labels';

interface ReviewPanelProps {
  proposed: ClassificationDto;
  onSubmit: (body: ReviewRequestBody) => void;
  isSubmitting: boolean;
  submitError?: string;
}

function toCorrection(proposed: ClassificationDto): ClassificationCorrection {
  return {
    category: proposed.category,
    priority: proposed.priority,
    department: proposed.department,
    summary: proposed.summary,
    suggestedResponse: proposed.suggestedResponse,
  };
}

export function ReviewPanel({ proposed, onSubmit, isSubmitting, submitError }: ReviewPanelProps) {
  const [draft, setDraft] = useState<ClassificationCorrection>(() => toCorrection(proposed));
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | undefined>(undefined);

  const update = <K extends keyof ClassificationCorrection>(
    key: K,
    value: ClassificationCorrection[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const isFieldModified = (key: keyof ClassificationCorrection): boolean => {
    return draft[key] !== toCorrection(proposed)[key];
  };

  const handleApprove = () => {
    setCommentError(undefined);
    const body: ReviewRequestBody = {
      decision: 'APPROVED',
      comment: comment.trim() ? comment.trim() : undefined,
      classification: draft,
    };
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      setCommentError(parsed.error.issues[0]?.message ?? 'Invalid review payload.');
      return;
    }
    onSubmit(parsed.data);
  };

  const handleReject = () => {
    const trimmed = comment.trim();
    const body = { decision: 'REJECTED', comment: trimmed };
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      setCommentError('A comment is required to reject a classification.');
      return;
    }
    setCommentError(undefined);
    onSubmit(parsed.data);
  };

  return (
    <div className="review-panel" aria-label="Review classification">
      <h3 className="review-panel__title">Review classification</h3>
      <p className="review-panel__hint">
        Adjust the proposed fields if needed. Modified fields are highlighted next to the AI
        proposal.
      </p>

      <Field id="review-category" label="Category">
        <select
          id="review-category"
          value={draft.category}
          onChange={(event) => {
            const value = CATEGORY_VALUES.find((item) => item === event.target.value);
            if (value) {
              update('category', value);
            }
          }}
        >
          {CATEGORY_VALUES.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
        <p className="review-panel__proposed">
          Proposed: {categoryLabel(proposed.category)}
          {isFieldModified('category') && <span className="review-panel__changed"> (modified)</span>}
        </p>
      </Field>

      <Field id="review-priority" label="Priority">
        <select
          id="review-priority"
          value={draft.priority}
          onChange={(event) => {
            const value = PRIORITY_VALUES.find((item) => item === event.target.value);
            if (value) {
              update('priority', value);
            }
          }}
        >
          {PRIORITY_VALUES.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabel(priority)}
            </option>
          ))}
        </select>
        <p className="review-panel__proposed">
          Proposed: {priorityLabel(proposed.priority)}
          {isFieldModified('priority') && <span className="review-panel__changed"> (modified)</span>}
        </p>
      </Field>

      <Field id="review-department" label="Department">
        <select
          id="review-department"
          value={draft.department}
          onChange={(event) => {
            const value = DEPARTMENT_VALUES.find((item) => item === event.target.value);
            if (value) {
              update('department', value);
            }
          }}
        >
          {DEPARTMENT_VALUES.map((department) => (
            <option key={department} value={department}>
              {departmentLabel(department)}
            </option>
          ))}
        </select>
        <p className="review-panel__proposed">
          Proposed: {departmentLabel(proposed.department)}
          {isFieldModified('department') && (
            <span className="review-panel__changed"> (modified)</span>
          )}
        </p>
      </Field>

      <Field id="review-summary" label="Summary">
        <textarea
          id="review-summary"
          rows={3}
          value={draft.summary}
          onChange={(event) => {
            update('summary', event.target.value);
          }}
        />
      </Field>

      <Field id="review-suggested-response" label="Suggested response">
        <textarea
          id="review-suggested-response"
          rows={4}
          value={draft.suggestedResponse}
          onChange={(event) => {
            update('suggestedResponse', event.target.value);
          }}
        />
      </Field>

      <Field
        id="review-comment"
        label="Comment"
        hint="Required when rejecting. Optional when approving."
        error={commentError}
      >
        <textarea
          id="review-comment"
          rows={2}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
          }}
        />
      </Field>

      {submitError !== undefined && (
        <p className="form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="review-panel__actions">
        <Button variant="primary" disabled={isSubmitting} onClick={handleApprove}>
          Approve
        </Button>
        <Button variant="danger" disabled={isSubmitting} onClick={handleReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}
