import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DEPARTMENTS, DEPARTMENT_ICONS, departmentToSlug } from '../utils/departments.js';

export default function ResolverDashboard() {
  const navigate = useNavigate();
  const [departmentCounts, setDepartmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('http://localhost:8000/resolver/departments');
        if (!res.ok) throw new Error('Failed to fetch department counts');
        const data = await res.json();
        const map = {};
        data.forEach((item) => { map[item.department] = item.ticket_count; });
        setDepartmentCounts(map);
      } catch {
        setError('Unable to load department statistics. Please check if the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const total = Object.values(departmentCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="page">
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <span className="topbar__logo-dot" />
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">Ticket Resolver</span>
        <div className="topbar__spacer" />
        {!loading && !error && total > 0 && (
          <span className="stat-chip stat-chip--active">
            {total} pending
          </span>
        )}
        <Link to="/" className="topbar__nav-back" style={{ marginLeft: '0.5rem' }}>← Home</Link>
      </nav>

      <div className="main-content main-content--wide">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Departments</h1>
            <p className="page-header__subtitle">Select a department to view and manage assigned tickets.</p>
          </div>
        </div>

        {loading && (
          <div className="dept-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: '72px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-lg)' }} />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="alert alert--error">{error}</div>
        )}

        {!loading && !error && (
          <div className="dept-grid">
            {DEPARTMENTS.map((dept) => {
              const count = departmentCounts[dept] || 0;
              const icon = DEPARTMENT_ICONS[dept] || '📁';
              const slug = departmentToSlug(dept);

              return (
                <div
                  key={dept}
                  className="dept-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/resolver/${slug}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/resolver/${slug}`); }}
                >
                  <span className="dept-card__icon">{icon}</span>
                  <div className="dept-card__body">
                    <div className="dept-card__name">{dept}</div>
                    <div className={`dept-card__count ${count > 0 ? 'dept-card__count--active' : ''}`}>
                      {count} {count === 1 ? 'ticket' : 'tickets'}
                    </div>
                  </div>
                  <span className="dept-card__chevron">›</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
