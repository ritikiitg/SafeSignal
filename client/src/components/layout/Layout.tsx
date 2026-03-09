import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useNeuroStore } from '../../stores/neuroStore';
import { useSound } from '../../hooks/useSound';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: ReactNode }) {
    const { user, logout } = useAuthStore();
    const { currentState, darkMode, toggleDarkMode, soundEnabled, toggleSound } = useNeuroStore();
    const navigate = useNavigate();
    const location = useLocation();
    const play = useSound();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        play('click');
        logout();
        navigate('/');
    };

    const stateColor = currentState === 'safe' ? 'var(--color-safe)' : currentState === 'guarded' ? 'var(--color-guarded)' : 'var(--color-overloaded)';

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/reflection', label: 'Reflection', icon: '📈' },
        { to: '/profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <div className={styles.layout}>
            <nav className={styles.nav}>
                <Link to="/dashboard" className={styles.logo} onClick={() => play('click')}>
                    <img src="/assets/logo_favi.png" alt="SafeSignal" />
                    <span className={styles.logoText}>SafeSignal</span>
                </Link>

                {/* Desktop nav links */}
                <div className={styles.navLinks}>
                    {navItems.map(({ to, label }) => (
                        <Link
                            key={to} to={to}
                            className={`${styles.navLink} ${location.pathname === to ? styles.active : ''}`}
                            onClick={() => play('click')}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                <div className={styles.navRight}>
                    <div className={styles.stateIndicator} style={{ background: `${stateColor}22`, color: stateColor }}>
                        <span className={styles.stateDot} style={{ background: stateColor }} />
                        {currentState.charAt(0).toUpperCase() + currentState.slice(1)}
                    </div>

                    <button className={styles.iconBtn} onClick={() => { play('click'); toggleDarkMode(); }} title="Toggle theme">
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    <button className={styles.iconBtn} onClick={() => { play('click'); toggleSound(); }} title="Toggle sound">
                        {soundEnabled ? '🔊' : '🔇'}
                    </button>

                    <div className={styles.userMenu}>
                        <span className={styles.userName}>{user?.name || user?.email?.split('@')[0]}</span>
                        <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                    </div>

                    {/* Hamburger button for mobile */}
                    <button className={styles.hamburger} onClick={() => { setMobileOpen(!mobileOpen); play('click'); }} aria-label="Menu">
                        <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ''}`} />
                        <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ''}`} />
                        <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ''}`} />
                    </button>
                </div>
            </nav>

            {/* Mobile drawer */}
            {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}
            <div className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ''}`}>
                <div className={styles.drawerHeader}>
                    <img src="/assets/logo_favi.png" alt="SafeSignal" style={{ height: 32 }} />
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>SafeSignal</span>
                </div>
                <div className={styles.drawerUser}>
                    <div className={styles.avatar}>{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
                    <div>
                        <strong>{user?.name || 'User'}</strong>
                        <p>{user?.email}</p>
                    </div>
                </div>
                <div className={styles.drawerLinks}>
                    {navItems.map(({ to, label, icon }) => (
                        <Link
                            key={to} to={to}
                            className={`${styles.drawerLink} ${location.pathname === to ? styles.drawerActive : ''}`}
                            onClick={() => { play('click'); setMobileOpen(false); }}
                        >
                            <span>{icon}</span> {label}
                        </Link>
                    ))}
                </div>
                <div className={styles.drawerActions}>
                    <div className={styles.drawerToggle} onClick={() => { toggleDarkMode(); play('click'); }}>
                        <span>{darkMode ? '☀️' : '🌙'}</span>
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <div className={styles.drawerToggle} onClick={() => { toggleSound(); play('click'); }}>
                        <span>{soundEnabled ? '🔊' : '🔇'}</span>
                        <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                    </div>
                </div>
                <button className={styles.drawerLogout} onClick={handleLogout}>Logout</button>
            </div>

            <main className={styles.main}>{children}</main>
        </div>
    );
}
