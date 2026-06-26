import { Classification } from '../../../domain/entities/classification.js';
import { ConfidenceScore } from '../../../domain/value-objects/confidence-score.js';
import type { Category, Department, Priority } from '../../../domain/value-objects/enums.js';

/** Denormalized JSON shape used to snapshot a classification inside a review decision. */
export interface ClassificationSnapshot {
  category: Category;
  priority: Priority;
  department: Department;
  summary: string;
  suggestedResponse: string;
  confidenceScore: number;
  provider: string;
  model: string;
  createdAt: string;
}

export function classificationToSnapshot(classification: Classification): ClassificationSnapshot {
  return {
    category: classification.category,
    priority: classification.priority,
    department: classification.department,
    summary: classification.summary,
    suggestedResponse: classification.suggestedResponse,
    confidenceScore: classification.confidenceScore.value,
    provider: classification.provider,
    model: classification.model,
    createdAt: classification.createdAt.toISOString(),
  };
}

export function snapshotToClassification(snapshot: ClassificationSnapshot): Classification {
  return Classification.create({
    category: snapshot.category,
    priority: snapshot.priority,
    department: snapshot.department,
    summary: snapshot.summary,
    suggestedResponse: snapshot.suggestedResponse,
    confidenceScore: ConfidenceScore.of(snapshot.confidenceScore),
    provider: snapshot.provider,
    model: snapshot.model,
    createdAt: new Date(snapshot.createdAt),
  });
}
