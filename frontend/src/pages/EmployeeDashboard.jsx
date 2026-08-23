import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, ChevronRight, AlertCircle, InboxIcon } from 'lucide-react';

const statusBadgeClass = (status) => {
  const map = {
    'Open':           'badge badge--open',
    'In Progress':    'badge badge--progress',
    'Resolved':       'badge badge--resolved',
    'Rejected':       'badge badge--rejected',
    'Pending Review': 'badge badge--review',
  };
  return map[status] || 'badge badge--neutral';
};

const priorityDotColor = (priority) => {
  const map = {
    Critical: 'var(--priority-critical)',
    High:     'var(--priority-high)',
    Medium:   'var(--priority-medium)',
    Low:      'var(--priority-low)',
  };
  return map[priority] || 'var(--priority-low)';
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('http://localhost:8000/tickets');
        if (!res.ok) throw new Error('Failed to fetch tickets');
        const data = await res.json();
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
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page">
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <div className="topbar__logo-mark">TCS</div>
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">My Tickets</span>
        <div className="topbar__spacer" />
        <Link to="/" className="topbar__nav-back">← Home</Link>
      </nav>

      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">My Tickets</h1>
            <p className="page-header__subtitle">Track and manage your support requests</p>
          </div>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => navigate('/employee/new-ticket')}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Ticket
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="ticket-list">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <div className="skeleton skeleton-line skeleton-line--short" />
                <div className="skeleton skeleton-line skeleton-line--medium" style={{ marginTop: '0.4rem' }} />
                <div className="skeleton skeleton-line skeleton-line--full" style={{ marginTop: '0.4rem' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="alert alert--error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">
              <InboxIcon size={18} strokeWidth={1.5} />
            </div>
            <div className="empty-state__title">No tickets yet</div>
            <div className="empty-state__body">You haven't submitted any support tickets. Create one to get started.</div>
            <button className="btn btn--primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/employee/new-ticket')}>
              <Plus size={14} strokeWidth={2.5} />
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
                      <span className="ticket-row__meta-item" style={{ color: 'var(--text-muted)' }}>{ticket.sub_category}</span>
                    )}
                    <span className="ticket-row__meta-item">
                      <span
                        className="priority-dot"
                        style={{ background: priorityDotColor(ticket.priority) }}
                      />
                      {ticket.priority || 'Medium'}
                    </span>
                    <span className="ticket-row__meta-item">{ticket.routed_to || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="ticket-row__aside">
                  <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
                  <span className="ticket-row__date">{formatDate(ticket.created_at)}</span>
                </div>
                <ChevronRight size={16} className="ticket-row__chevron" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;