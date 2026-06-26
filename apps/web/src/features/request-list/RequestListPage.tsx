import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequests } from '../../shared/api/hooks';
import { Spinner } from '../../shared/components/Spinner';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { EmptyState } from '../../shared/components/EmptyState';
import { RequestFilters, type RequestFiltersValue } from './RequestFilters';
import { RequestTable } from './RequestTable';

const PAGE_SIZE = 20;

export function RequestListPage() {
  const [filters, setFilters] = useState<RequestFiltersValue>({});
  const [page, setPage] = useState(1);

  const query = useRequests({
    status: filters.status,
    category: filters.category,
    priority: filters.priority,
    page,
    pageSize: PAGE_SIZE,
  });

  const handleFiltersChange = (next: RequestFiltersValue) => {
    setFilters(next);
    setPage(1);
  };

  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Support requests</h1>
          <p className="page__subtitle">Review AI-classified support requests.</p>
        </div>
        <Link className="btn btn--primary" to="/requests/new">
          New request
        </Link>
      </header>

      <RequestFilters value={filters} onChange={handleFiltersChange} />

      {query.isPending && <Spinner label="Loading requests…" />}

      {query.isError && (
        <ErrorMessage
          message={query.error.message}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}

      {query.isSuccess && query.data.items.length === 0 && (
        <EmptyState
          title="No requests found"
          description="Try adjusting the filters or create a new support request."
          action={
            <Link className="btn btn--primary" to="/requests/new">
              New request
            </Link>
          }
        />
      )}

      {query.isSuccess && query.data.items.length > 0 && (
        <>
          <RequestTable requests={query.data.items} />
          <nav className="pagination" aria-label="Pagination">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
              }}
            >
              Previous
            </button>
            <span className="pagination__status">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={page >= pageCount}
              onClick={() => {
                setPage((current) => current + 1);
              }}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
