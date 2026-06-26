import { NavLink, Outlet } from 'react-router-dom';
import { DemoUserSelector } from './DemoUserSelector';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link';
}

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" aria-hidden="true">
            ◆
          </span>
          <span className="app-header__title">FlowReview</span>
        </div>
        <nav className="app-nav" aria-label="Primary">
          <NavLink to="/requests" className={navLinkClass}>
            Requests
          </NavLink>
          <NavLink to="/requests/new" className={navLinkClass}>
            New request
          </NavLink>
        </nav>
        <DemoUserSelector />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
