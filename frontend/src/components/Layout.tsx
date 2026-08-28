import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, LayoutDashboard, Briefcase, Building2, FileText, Users, ShieldCheck, UserCheck } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs',      path: '/jobs',      icon: Briefcase },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Referrals', path: '/referrals', icon: UserCheck },
    { name: 'Intel',     path: '/intel',     icon: ShieldCheck },
  ];
  if (user?.role === 'candidate') {
    navItems.push({ name: 'My Apps', path: '/applications', icon: FileText });
  }
  if (user?.role === 'recruiter') {
    navItems.push({ name: 'ATS', path: '/ats', icon: Users });
  }

  return (
    <div className="min-h-screen" style={{ background: '#000', color: '#fff' }}>
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #1a1a1a',
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 24px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo + Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link to="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', color: '#fff',
            }}>
              <div style={{
                width: 28, height: 28,
                background: '#fff', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, color: '#000',
                letterSpacing: '-0.04em',
              }}>L</div>
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em' }}>LoopBack</span>
            </Link>

            <nav style={{ display: 'flex', gap: 2 }}>
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 7,
                      fontSize: 13, fontWeight: 500,
                      textDecoration: 'none',
                      color: isActive ? '#fff' : '#737373',
                      background: isActive ? '#1a1a1a' : 'transparent',
                      transition: 'color .15s ease, background .15s ease',
                    }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = '#d4d4d4'; (e.currentTarget as HTMLElement).style.background = '#111'; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = '#737373'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
                  >
                    <Icon size={14} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: '#525252' }}>
              {user?.full_name}
            </span>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'none', border: '1px solid #1a1a1a',
                borderRadius: 7, padding: 6, cursor: 'pointer',
                color: '#525252', display: 'flex', alignItems: 'center',
                transition: 'color .15s, border-color .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = '#7f1d1d'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#525252'; (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a'; }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 24px' }}>
        {children}
      </main>
    </div>
  );
};
