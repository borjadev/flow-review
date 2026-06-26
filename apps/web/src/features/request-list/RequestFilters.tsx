import {
  CATEGORY_VALUES,
  PRIORITY_VALUES,
  REQUEST_STATUS_VALUES,
  type Category,
  type Priority,
  type RequestStatus,
} from '@flow-review/contracts';
import { categoryLabel, priorityLabel, statusLabel } from '../../entities/request/labels';

export interface RequestFiltersValue {
  status?: RequestStatus;
  category?: Category;
  priority?: Priority;
}

interface RequestFiltersProps {
  value: RequestFiltersValue;
  onChange: (next: RequestFiltersValue) => void;
}

export function RequestFilters({ value, onChange }: RequestFiltersProps) {
  return (
    <div className="filters" aria-label="Request filters">
      <div className="field field--inline">
        <label className="field__label" htmlFor="filter-status">
          Status
        </label>
        <select
          id="filter-status"
          value={value.status ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            onChange({ ...value, status: next ? (next as RequestStatus) : undefined });
          }}
        >
          <option value="">All</option>
          {REQUEST_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="field field--inline">
        <label className="field__label" htmlFor="filter-category">
          Category
        </label>
        <select
          id="filter-category"
          value={value.category ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            onChange({ ...value, category: next ? (next as Category) : undefined });
          }}
        >
          <option value="">All</option>
          {CATEGORY_VALUES.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div className="field field--inline">
        <label className="field__label" htmlFor="filter-priority">
          Priority
        </label>
        <select
          id="filter-priority"
          value={value.priority ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            onChange({ ...value, priority: next ? (next as Priority) : undefined });
          }}
        >
          <option value="">All</option>
          {PRIORITY_VALUES.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabel(priority)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
