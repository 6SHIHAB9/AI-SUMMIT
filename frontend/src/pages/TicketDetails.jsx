import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const statusBadge = (status) => {
  const map = {
    'Open':           'badge badge--open',
    'In Progress':    'badge badge--progress',
    'Resolved':       'badge badge--resolved',
    'Rejected':       'badge badge--rejected',
    'Pending Review': 'badge badge--review',
  };
  return map[status] || 'badge';
};

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchTicket = async () => {
      try {
        const res = await fetch(`http://localhost:8000/tickets/${ticketId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Ticket not found.');
          throw new Error('Failed to load ticket details.');
        }
        setTicket(await res.json());
      } catch (err) {
        setError(err.message || 'Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="page">
        <nav className="topbar">
          <Link to="/" className="topbar__logo"><span className="topbar__logo-dot" />IT Helpdesk</Link>
          <div className="topbar__divider" />
          <span className="topbar__section">Ticket Details</span>
        </nav>
        <div className="main-content">
          <div className="skeleton skeleton-line skeleton-line--short" style={{ marginBottom: '1rem', height: '1.5rem' }} />
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-line skeleton-line--full" style={{ marginBottom: '0.6rem' }} />)}
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page">
        <nav className="topbar">
          <Link to="/" className="topbar__logo"><span className="topbar__logo-dot" />IT Helpdesk</Link>
          <div className="topbar__divider" />
          <span className="topbar__section">Ticket Details</span>
          <div className="topbar__spacer" />
          <button className="topbar__nav-back" onClick={() => navigate('/employee')}>← My Tickets</button>
        </nav>
        <div className="main-content">
          <div className="empty-state">
            <div className="empty-state__icon">⚠️</div>
            <div className="empty-state__title">{error || 'Ticket not found'}</div>
            <button className="btn btn--secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/employee')}>
              ← Back to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kbSources = (() => {
    try { return ticket.kb_sources ? JSON.parse(ticket.kb_sources) : null; } catch { return null; }
  })();

  return (
    <div className="page">
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <span className="topbar__logo-dot" />
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">Ticket Details</span>
        <div className="topbar__spacer" />
        <button className="topbar__nav-back" onClick={() => navigate('/employee')}>
          ← My Tickets
        </button>
      </nav>

      <div className="main-content">
        <div className="ticket-detail">

          {/* Header */}
          <div className="ticket-detail__header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ticket-detail__id">{ticket.ticket_id}</span>
              <h1 className="ticket-detail__title">{ticket.subject}</h1>
              <div className="ticket-detail__badges">
                <span className={statusBadge(ticket.status)}>{ticket.status}</span>
                {ticket.human_approval_required && ticket.status === 'Pending Review' && (
                  <span className="badge badge--review">Pending Human Review</span>
                )}
              </div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="ticket-detail__meta-grid">
            {[
              ['Created',     formatDate(ticket.created_at)],
              ['Raised By',   ticket.raised_by],
              ['Category',    ticket.category || '—'],
              ['Sub-category',ticket.sub_category || '—'],
              ['Priority',    ticket.priority || '—'],
              ['Urgency',     ticket.urgency || '—'],
              ['Sentiment',   ticket.sentiment || '—'],
              ['Routed To',   ticket.routed_to || '—'],
            ].map(([label, val]) => (
              <div className="meta-cell" key={label}>
                <div className="meta-cell__label">{label}</div>
                <div className="meta-cell__value">{val}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="content-section">
            <div className="content-section__title">Description</div>
            <div className="content-section__body">{ticket.description}</div>
          </div>

          {/* Attachment */}
          {ticket.attachment && (
            <div className="content-section">
              <div className="content-section__title">Attachment</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{ticket.attachment}</div>
            </div>
          )}

          {/* Resolved */}
          {ticket.status === 'Resolved' && (
            <div className="alert alert--success">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>✓ Resolved</div>
                <div style={{ fontSize: '0.83rem' }}>{ticket.resolver_comment || 'Ticket resolved by the support team.'}</div>
              </div>
            </div>
          )}

          {/* In Progress */}
          {ticket.status === 'In Progress' && ticket.resolver_comment && (
            <div className="alert alert--info">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>⚡ In Progress</div>
                <div style={{ fontSize: '0.83rem' }}>{ticket.resolver_comment}</div>
              </div>
            </div>
          )}

          {/* Rejected */}
          {ticket.status === 'Rejected' && (
            <div className="alert alert--error">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>✕ Rejected</div>
                <div style={{ fontSize: '0.83rem' }}>
                  {ticket.rejection_reason || ticket.resolver_rejection_reason || ticket.resolver_comment || 'No rejection reason provided.'}
                </div>
              </div>
            </div>
          )}

          {/* Human review */}
          {ticket.human_approval_required && ticket.status === 'Pending Review' && (
            <div className="alert alert--warning">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Pending Human Review</div>
                <div style={{ fontSize: '0.83rem' }}>{ticket.approval_reason}</div>
              </div>
            </div>
          )}

          {/* AI Suggested Resolution */}
          {!ticket.human_approval_required && ticket.suggested_resolution && (
            <div className="resolution-section">
              <div className="resolution-section__title">Suggested Resolution</div>
              <div className="resolution-section__body markdown-body">
                <ReactMarkdown>{ticket.suggested_resolution}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* No KB match */}
          {!ticket.human_approval_required && !ticket.suggested_resolution && (
            <div className="content-section">
              <div className="content-section__title">Resolution</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {ticket.kb_message || 'No automated resolution found. A resolver will investigate your ticket.'}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TicketDetails;