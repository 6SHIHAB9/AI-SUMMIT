import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const statusBadgeClass = (status) => {
  switch (status) {
    case 'Open':           return 'badge badge--open';
    case 'In Progress':    return 'badge badge--progress';
    case 'Resolved':       return 'badge badge--resolved';
    case 'Rejected':       return 'badge badge--rejected';
    case 'Pending Review': return 'badge badge--review';
    default:               return 'badge';
  }
};

const priorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return 'var(--priority-critical-text)';
    case 'High':     return 'var(--priority-high-text)';
    case 'Low':      return 'var(--priority-low-text)';
    default:         return 'var(--priority-medium-text)';
  }
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:8000/tickets');
        if (!response.ok) throw new Error('Failed to fetch tickets');
        const data = await response.json();
        setTickets(data.filter((t) => t.raised_by === 'employee@tcs.com'));
      } catch {
        setError('Unable to load tickets. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page">
      {/* Topbar */}
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <span className="topbar__logo-dot" />
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">My Tickets</span>
        <div className="topbar__spacer" />
        <Link to="/" className="topbar__nav-back">← Home</Link>
      </nav>

      <div className="main-content">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-header__title">My Tickets</h1>
            <p className="page-header__subtitle">Track and manage your support requests</p>
          </div>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => navigate('/employee/new-ticket')}
          >
            + New Ticket
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ padding: '1rem 1.1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div className="skeleton skeleton-line skeleton-line--short" />
                <div className="skeleton skeleton-line skeleton-line--medium" style={{ marginTop: '0.5rem' }} />
                <div className="skeleton skeleton-line skeleton-line--full" style={{ marginTop: '0.5rem' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="alert alert--error">{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <div className="empty-state__title">No tickets yet</div>
            <div className="empty-state__body">You haven't submitted any support tickets. Create one to get started.</div>
            <button className="btn btn--primary" style={{ marginTop: '1.1rem' }} onClick={() => navigate('/employee/new-ticket')}>
              Create First Ticket
            </button>
          </div>
        )}

        {/* Ticket list */}
        {!loading && !error && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="ticket-row"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/employee/ticket/${ticket.ticket_id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/employee/ticket/${ticket.ticket_id}`); }}
              >
                <div className="ticket-row__main">
                  <div className="ticket-row__id">{ticket.ticket_id}</div>
                  <div className="ticket-row__subject">{ticket.subject}</div>
                  <div className="ticket-row__meta">
                    <span className="ticket-row__meta-item">{ticket.category || 'Uncategorized'}</span>
                    {ticket.sub_category && (
                      <span className="ticket-row__meta-item" style={{ color: 'var(--text-muted)' }}>
                        {ticket.sub_category}
                      </span>
                    )}
                    <span className="ticket-row__meta-item">
                      <span style={{ color: priorityColor(ticket.priority), fontWeight: 700, fontSize: '0.75rem' }}>
                        ● {ticket.priority || 'Medium'}
                      </span>
                    </span>
                    <span className="ticket-row__meta-item">{ticket.routed_to || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="ticket-row__aside">
                  <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
                  <span className="ticket-row__date">{formatDate(ticket.created_at)}</span>
                </div>
                <span className="ticket-row__chevron">›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;