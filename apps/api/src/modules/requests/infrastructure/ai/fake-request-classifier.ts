import type { Category, Department, Priority } from '../../domain/value-objects/enums.js';
import type {
  ClassificationInput,
  ClassificationResult,
  RequestClassifier,
} from '../../application/ports/request-classifier.js';

interface CategoryRule {
  category: Category;
  department: Department;
  keywords: string[];
  response: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'BILLING',
    department: 'FINANCE',
    keywords: ['invoice', 'payment', 'refund', 'charge', 'billing', 'subscription', 'overcharged'],
    response: 'Thanks for reaching out. We are reviewing the billing details you reported.',
  },
  {
    category: 'TECHNICAL_SUPPORT',
    department: 'TECHNICAL_SUPPORT',
    keywords: ['error', 'bug', 'crash', 'unavailable', 'down', 'broken', 'failing', 'exception'],
    response: 'Thanks for the report. Our technical team is investigating the issue.',
  },
  {
    category: 'ACCOUNT',
    department: 'CUSTOMER_SUCCESS',
    keywords: ['login', 'password', 'profile', 'account', 'sign in', 'access', 'locked'],
    response: 'We can help with your account. We are looking into the access problem.',
  },
  {
    category: 'SALES',
    department: 'SALES',
    keywords: ['demo', 'price', 'pricing', 'quote', 'quotation', 'purchase', 'buy', 'plan'],
    response: 'Thanks for your interest. A sales specialist will follow up shortly.',
  },
  {
    category: 'LEGAL',
    department: 'LEGAL_OPERATIONS',
    keywords: ['contract', 'clause', 'legal', 'gdpr', 'terms', 'compliance', 'agreement'],
    response: 'Thank you. Our legal operations team will review your request.',
  },
];

const FALLBACK: Omit<CategoryRule, 'keywords'> = {
  category: 'GENERAL',
  department: 'GENERAL_SUPPORT',
  response: 'Thanks for contacting us. A support agent will get back to you soon.',
};

const PRIORITY_KEYWORDS: Array<{ priority: Priority; keywords: string[] }> = [
  { priority: 'URGENT', keywords: ['urgent', 'immediately', 'blocked', 'production down', 'asap'] },
  { priority: 'HIGH', keywords: ['as soon as possible', 'important', 'high priority', 'soon'] },
  { priority: 'LOW', keywords: ['question', 'information', 'info', 'whenever', 'no rush'] },
];

/** Deterministic positive integer hash of a string (FNV-1a style, simplified). */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function countMatches(haystack: string, keywords: string[]): number {
  return keywords.reduce((total, keyword) => (haystack.includes(keyword) ? total + 1 : total), 0);
}

/**
 * Adapter implementing the RequestClassifier port without any external service.
 * It is deterministic (same input → same output) yet content-sensitive (different
 * inputs yield different categories, priorities and confidences), which makes it
 * ideal for offline demos and reproducible tests. See ADR-0002.
 */
export class FakeRequestClassifier implements RequestClassifier {
  static readonly PROVIDER = 'fake';
  static readonly MODEL = 'rules-v1';

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const haystack = `${input.subject} ${input.description}`.toLowerCase();

    let best: CategoryRule | null = null;
    let bestHits = 0;
    for (const rule of CATEGORY_RULES) {
      const hits = countMatches(haystack, rule.keywords);
      if (hits > bestHits) {
        best = rule;
        bestHits = hits;
      }
    }

    const matched = best ?? { ...FALLBACK, keywords: [] };
    const priority = this.resolvePriority(haystack);
    const confidenceScore = this.resolveConfidence(bestHits, haystack);

    return {
      category: matched.category,
      priority,
      department: matched.department,
      summary: this.buildSummary(input, matched.category),
      suggestedResponse: matched.response,
      confidenceScore,
      provider: FakeRequestClassifier.PROVIDER,
      model: FakeRequestClassifier.MODEL,
    };
  }

  private resolvePriority(haystack: string): Priority {
    for (const { priority, keywords } of PRIORITY_KEYWORDS) {
      if (countMatches(haystack, keywords) > 0) {
        return priority;
      }
    }
    return 'MEDIUM';
  }

  private resolveConfidence(hits: number, haystack: string): number {
    // No keyword match → genuinely low confidence (routes to general support).
    const base = hits === 0 ? 0.35 : Math.min(0.6 + hits * 0.12, 0.97);
    // Deterministic jitter in [0, 0.04] so confidence varies with the content.
    const jitter = (hash(haystack) % 5) / 100;
    return Math.round(Math.min(base + jitter, 0.99) * 100) / 100;
  }

  private buildSummary(input: ClassificationInput, category: Category): string {
    const topic = category.toLowerCase().replace(/_/g, ' ');
    const subject = input.subject.trim();
    return `${input.requesterName} raised a ${topic} request: "${subject}".`;
  }
}
