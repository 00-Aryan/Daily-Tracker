import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/tasks', label: 'Tasks', icon: '📋' },
  { path: '/daily-log', label: 'Daily Log', icon: '📓' },
  { path: '/study', label: 'Study Q&A', icon: '🧠' },
  { path: '/jobs', label: 'Jobs', icon: '💼' },
];

export default function Sidebar() {
  return (
    <div className="h-full flex flex-col bg-[var(--color-sidebar)]">
      <div className="px-5 py-6">
        <span className="font-display text-base font-semibold text-[var(--color-accent)]">
          ProductivOS
        </span>
      </div>
      <div className="border-b border-[var(--color-sidebar-hover)]" />
      <nav className="flex flex-col py-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--color-sidebar-hover)] text-[var(--color-text-inverse)]'
                  : 'text-[var(--color-text-sidebar)] hover:text-[var(--color-text-inverse)] hover:bg-[var(--color-sidebar-hover)]/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-accent)] rounded-full" />
                )}
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <p className="px-5 py-4 text-xs text-[#334155] mt-auto">v0.1</p>
    </div>
  );
}
