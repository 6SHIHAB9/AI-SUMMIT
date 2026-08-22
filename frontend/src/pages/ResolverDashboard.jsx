import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Resolver.css';
import './Employee.css';
import { DEPARTMENTS, DEPARTMENT_ICONS, departmentToSlug } from '../utils/departments.js';

export default function ResolverDashboard() {
  const navigate = useNavigate();
  const [departmentCounts, setDepartmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDepartmentCounts = async () => {
    try {
      const response = await fetch('http://localhost:8000/resolver/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch department counts');
      }
      const data = await response.json();
      
      const countsMap = {};
      data.forEach((item) => {
        countsMap[item.department] = item.ticket_count;
      });
      setDepartmentCounts(countsMap);
    } catch (err) {
      setError('Unable to load department statistics. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentCounts();
  }, []);

  const totalPendingTickets = Object.values(departmentCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="resolver-layout">
      <header className="resolver-header">
        <div>
          <h1>Ticket Resolver</h1>
          <p>Select a department to view and manage assigned tickets.</p>
        </div>
        {!loading && !error && (
          <div className="resolver-badge-count">
            <span>●</span> {totalPendingTickets} Total Pending
          </div>
        )}
      </header>

      {loading && (
        <div className="centered-message" style={{ marginTop: '3rem' }}>
          <p>Loading departments...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#fca5a5',
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
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
                onClick={() => navigate(`/resolver/${slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/resolver/${slug}`);
                  }
                }}
              >
                <div className="dept-card__icon">{icon}</div>
                <h3 className="dept-card__title">{dept}</h3>
                <p className={`dept-card__count ${count > 0 ? 'has-tickets' : ''}`}>
                  {count} {count === 1 ? 'Ticket' : 'Tickets'}
                </p>
                <button
                  type="button"
                  className="dept-card__btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/resolver/${slug}`);
                  }}
                >
                  View Tickets
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="back-link" style={{ marginTop: '3rem' }}>
        <Link to="/" style={{ color: '#8b93a7', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
