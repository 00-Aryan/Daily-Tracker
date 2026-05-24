import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/tasks', label: 'Tasks', icon: '📋' },
  { path: '/daily-log', label: 'Daily Log', icon: '📓' },
  { path: '/study', label: 'Study Q&A', icon: '🧠' },
  { path: '/jobs', label: 'Jobs', icon: '💼' },
];

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

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
                  ? 'bg-[#1E293B] text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F97316] rounded-full" />
                )}
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {user && (
        <div className="px-4 py-4 mt-auto border-t border-[var(--color-sidebar-hover)]">
          <div className="flex flex-col gap-2">
            <p className="px-2 text-[10px] uppercase font-bold text-[#475569] tracking-widest">
              Account
            </p>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-[#94A3B8] 
                         hover:text-white hover:bg-[#1E293B]/60 transition-all duration-150"
            >
              <span>Logout</span>
              <span className="text-[10px] ml-auto opacity-50">{user.email?.split('@')[0]}</span>
            </button>
          </div>
        </div>
      )}
      
      {!user && (
        <p className="px-5 py-4 text-xs text-[#334155] mt-auto">v0.1</p>
      )}
    </div>
  );
}
