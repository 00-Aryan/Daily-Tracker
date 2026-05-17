import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/tasks': 'Tasks',
  '/daily-log': 'Daily Log',
  '/study': 'Study Q&A',
  '/jobs': 'Job Tracker',
};

export default function Navbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'ProductivOS';

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-14 shrink-0 bg-[var(--color-card)] border-b border-[var(--color-border)] flex items-center justify-between px-6">
      <h2 className="font-display italic text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
        {title}
      </h2>
      <time className="text-sm text-[var(--color-text-muted)] tabular-nums">
        {today}
      </time>
    </header>
  );
}
