import type { ConfidenceScore } from '../value-objects/confidence-score.js';
import type { Category, Department, Priority } from '../value-objects/enums.js';

export interface ClassificationProps {
  category: Category;
  priority: Priority;
  department: Department;
  summary: string;
  suggestedResponse: string;
  confidenceScore: ConfidenceScore;
  provider: string;
  model: string;
  createdAt: Date;
}

export interface ClassificationCorrections {
  category: Category;
  priority: Priority;
  department: Department;
  summary: string;
  suggestedResponse: string;
}

/**
 * Immutable snapshot of one classification run (or a human-reviewed version of
 * it). Multiple analyses can exist per request — they are never mutated in
 * place; corrections produce a new instance via {@link withCorrections}.
 */
export class Classification {
  private constructor(private readonly props: ClassificationProps) {}

  static create(props: ClassificationProps): Classification {
    return new Classification({ ...props });
  }

  /**
   * Produce the final, human-reviewed classification. Provenance fields
   * (confidence, provider, model, createdAt) are retained from the AI run; only
   * the human-editable fields are overridden.
   */
  withCorrections(corrections: ClassificationCorrections): Classification {
    return new Classification({
      ...this.props,
      category: corrections.category,
      priority: corrections.priority,
      department: corrections.department,
      summary: corrections.summary,
      suggestedResponse: corrections.suggestedResponse,
    });
  }

  get category(): Category {
    return this.props.category;
  }

  get priority(): Priority {
    return this.props.priority;
  }

  get department(): Department {
    return this.props.department;
  }

  get summary(): string {
    return this.props.summary;
  }

  get suggestedResponse(): string {
    return this.props.suggestedResponse;
  }

  get confidenceScore(): ConfidenceScore {
    return this.props.confidenceScore;
  }

  get provider(): string {
    return this.props.provider;
  }

  get model(): string {
    return this.props.model;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  differsFrom(other: ClassificationCorrections): boolean {
    return (
      this.props.category !== other.category ||
      this.props.priority !== other.priority ||
      this.props.department !== other.department ||
      this.props.summary !== other.summary ||
      this.props.suggestedResponse !== other.suggestedResponse
    );
  }
}
