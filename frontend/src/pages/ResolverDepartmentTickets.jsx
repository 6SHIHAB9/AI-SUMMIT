import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { slugToDepartment } from '../utils/departments.js';
import { AlertCircle, CheckCircle2, ChevronRight, InboxIcon } from 'lucide-react';

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

const priorityDotColor = (p) => {
  const map = { Critical: 'var(--priority-critical)', High: 'var(--priority-high)', Medium: 'var(--priority-medium)', Low: 'var(--priority-low)' };
  return map[p] || 'var(--priority-low)';
};

export default function ResolverDepartmentTickets() {
  const { departmentSlug } = useParams();
  const navigate = useNavigate();
  const departmentName = slugToDepartment(departmentSlug);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/resolver/tickets/${departmentSlug}`);
        if (!res.ok) throw new Error('Failed to load tickets for this department');
        const data = await res.json();
        setTickets(data.filter((t) => t.status === 'Open' || t.status === 'In Progress'));
      } catch {
        setError('Unable to load department tickets.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [departmentSlug]);

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
        <span className="topbar__section">Ticket Resolver</span>
        <div className="topbar__spacer" />
        {!loading && !error && (
          <span className="stat-chip" style={{ marginRight: '0.4rem' }}>{tickets.length} active</span>
        )}
        <button className="topbar__nav-back" onClick={() => navigate('/resolver')}>← Departments</button>
      </nav>

      <div className="main-content main-content--wide">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">{departmentName}</h1>
            <p className="page-header__subtitle">Open and in-progress tickets awaiting resolution</p>
          </div>
        </div>

        {/* Loading */}
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

        {error && !loading && (
          <div className="alert alert--error"><AlertCircle size={14} />{error}</div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon"><CheckCircle2 size={18} strokeWidth={1.5} /></div>
            <div className="empty-state__title">Queue cleared</div>
            <div className="empty-state__body">All tickets for {departmentName} have been resolved or rejected.</div>
            <button className="btn btn--secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/resolver')}>← Back to Departments</button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="ticket-row"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/resolver/ticket/${ticket.ticket_id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/resolver/ticket/${ticket.ticket_id}`); }}
              >
                <div className="ticket-row__main">
                  <div className="ticket-row__id">{ticket.ticket_id}</div>
                  <div className="ticket-row__subject">{ticket.subject}</div>
                  <div className="ticket-row__meta">
                    <span className="ticket-row__meta-item">{ticket.raised_by}</span>
                    <span className="ticket-row__meta-item">{ticket.category || 'Uncategorized'}</span>
                    {ticket.sub_category && (
                      <span className="ticket-row__meta-item" style={{ color: 'var(--text-muted)' }}>{ticket.sub_category}</span>
                    )}
                    <span className="ticket-row__meta-item">
                      <span className="priority-dot" style={{ background: priorityDotColor(ticket.priority) }} />
                      {ticket.priority || 'Medium'}
                    </span>
                    {ticket.resolver_comment && (
                      <span className="ticket-row__meta-item" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Has notes</span>
                    )}
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
}
