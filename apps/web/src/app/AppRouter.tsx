import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { RequestListPage } from '../features/request-list/RequestListPage';
import { CreateRequestPage } from '../features/request-creation/CreateRequestPage';
import { RequestDetailsPage } from '../features/request-details/RequestDetailsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/requests" replace />} />
        <Route path="requests" element={<RequestListPage />} />
        <Route path="requests/new" element={<CreateRequestPage />} />
        <Route path="requests/:requestId" element={<RequestDetailsPage />} />
        <Route path="*" element={<Navigate to="/requests" replace />} />
      </Route>
    </Routes>
  );
}
