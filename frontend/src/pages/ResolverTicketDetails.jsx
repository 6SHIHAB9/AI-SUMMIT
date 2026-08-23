import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { departmentToSlug } from '../utils/departments.js';

const statusBadgeClass = (status) => {
  const map = {
    'Open':           'badge badge--open',
    'In Progress':    'badge badge--progress',
    'Resolved':       'badge badge--resolved',
    'Rejected':       'badge badge--rejected',
    'Pending Review': 'badge badge--review',
  };
  return map[status] || 'badge';
};

export default function ResolverTicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [validationError, setValidationError] = useState('');

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:8000/resolver/ticket/${ticketId}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Ticket not found' : 'Failed to load ticket details');
      }
      const data = await res.json();
      setTicket(data);
      setSelectedStatus(data.status || 'Open');
      if (data.resolver_comment) setComment(data.resolver_comment);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchTicket();
  }, [ticketId]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setActionSuccess('');

    if ((selectedStatus === 'Resolved' || selectedStatus === 'Rejected') && !comment.trim()) {
      setValidationError(
        selectedStatus === 'Resolved'
          ? 'A resolution comment is required when resolving a ticket.'
          : 'A rejection reason is required when rejecting a ticket.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/resolver/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, comment: comment.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update ticket status');
      }
      const updated = await res.json();
      setTicket(updated);
      setActionSuccess(`Ticket updated to "${selectedStatus}".`);
    } catch (err) {
      setValidationError(err.message || 'Failed to update ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const isTerminal = ticket && (ticket.status === 'Resolved' || ticket.status === 'Rejected');
  const deptSlug = ticket ? departmentToSlug(ticket.routed_to) : null;

  const kbSources = (() => {
    try { return ticket?.kb_sources ? JSON.parse(ticket.kb_sources) : null; } catch { return null; }
  })();

  const actionBtnClass = () => {
    if (selectedStatus === 'Resolved') return 'btn btn--success btn--lg';
    if (selectedStatus === 'Rejected') return 'btn btn--danger btn--lg';
    return 'btn btn--primary btn--lg';
  };

  const actionBtnLabel = () => {
    if (submitting) return 'Saving…';
    if (selectedStatus === 'Resolved') return 'Mark as Resolved';
    if (selectedStatus === 'Rejected') return 'Reject Ticket';
    if (selectedStatus === 'In Progress') return 'Mark In Progress';
    return 'Update Status';
  };

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
          <span className="topbar__section">Ticket Resolver</span>
        </nav>
        <div className="main-content">
          <div className="skeleton skeleton-line skeleton-line--short" style={{ height: '1.5rem', marginBottom: '1rem' }} />
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
          <span className="topbar__section">Ticket Resolver</span>
          <div className="topbar__spacer" />
          <button className="topbar__nav-back" onClick={() => navigate('/resolver')}>← Departments</button>
        </nav>
        <div className="main-content">
          <div className="empty-state">
            <div className="empty-state__icon">⚠️</div>
            <div className="empty-state__title">{error || 'Ticket not found'}</div>
            <button className="btn btn--secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/resolver')}>
              ← Resolver Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Topbar */}
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <span className="topbar__logo-dot" />
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">Ticket Resolver</span>
        <div className="topbar__spacer" />
        <button
          className="topbar__nav-back"
          onClick={() => deptSlug ? navigate(`/resolver/${deptSlug}`) : navigate('/resolver')}
        >
          ← {ticket.routed_to || 'Departments'}
        </button>
      </nav>

      <div className="main-content">
        <div className="ticket-detail">

          {/* Header */}
          <div className="ticket-detail__header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ticket-detail__id">{ticket.ticket_id} · {formatDate(ticket.created_at)}</span>
              <h1 className="ticket-detail__title">{ticket.subject}</h1>
              <div className="ticket-detail__badges">
                <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
                {ticket.urgency && (
                  <span className="badge" style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                    {ticket.urgency} urgency
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="ticket-detail__meta-grid">
            {[
              ['Raised By',   ticket.raised_by],
              ['Routed To',   ticket.routed_to || '—'],
              ['Category',    ticket.category || '—'],
              ['Sub-category',ticket.sub_category || '—'],
              ['Priority',    ticket.priority || '—'],
              ['Urgency',     ticket.urgency || '—'],
              ['Sentiment',   ticket.sentiment || '—'],
              ['AI Confidence', ticket.confidence ? `${Math.round(ticket.confidence * 100)}%` : '—'],
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

          {/* AI Suggested Resolution */}
          {ticket.suggested_resolution ? (
            <div className="resolution-section">
              <div className="resolution-section__title">Suggested Resolution</div>
              <div className="resolution-section__body markdown-body">
                <ReactMarkdown>{ticket.suggested_resolution}</ReactMarkdown>
              </div>
              {kbSources && kbSources.length > 0 && (
                <div className="resolution-section__sources">
                  <div className="resolution-section__sources-label">Knowledge Base Sources</div>
                  {kbSources.map((s, i) => (
                    <span key={i} className="resolution-section__source-item">{s.source}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="content-section">
              <div className="content-section__title">Suggested Resolution</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {ticket.kb_message || 'No automated resolution found in the Knowledge Base.'}
              </div>
            </div>
          )}

          {/* Previous resolver notes (In Progress) */}
          {ticket.resolver_comment && ticket.status === 'In Progress' && (
            <div className="alert alert--info">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Resolver Notes</div>
                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{ticket.resolver_comment}</div>
              </div>
            </div>
          )}

          {/* Resolved / Rejected terminal state */}
          {ticket.status === 'Resolved' && (
            <div className="alert alert--success">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>✓ Resolved</div>
                <div style={{ fontSize: '0.83rem', whiteSpace: 'pre-wrap' }}>{ticket.resolver_comment || 'Ticket has been resolved.'}</div>
              </div>
            </div>
          )}

          {ticket.status === 'Rejected' && (
            <div className="alert alert--error">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>✕ Rejected</div>
                <div style={{ fontSize: '0.83rem', whiteSpace: 'pre-wrap' }}>{ticket.resolver_comment || 'Ticket has been rejected.'}</div>
              </div>
            </div>
          )}

          {/* Action panel — only for non-terminal tickets */}
          {!isTerminal && (
            <div className="action-panel">
              <div className="action-panel__title">Update Ticket</div>

              {actionSuccess && (
                <div className="alert alert--success" style={{ marginBottom: '1rem' }}>
                  <span>✓ {actionSuccess}</span>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ marginLeft: 'auto', fontSize: '0.8rem' }}
                    onClick={() => navigate(deptSlug ? `/resolver/${deptSlug}` : '/resolver')}
                  >
                    Back to Queue
                  </button>
                </div>
              )}

              {validationError && (
                <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                  ⚠ {validationError}
                </div>
              )}

              <form onSubmit={handleStatusSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="status-select">Status</label>
                  <select
                    id="status-select"
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setValidationError(''); setActionSuccess(''); }}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="resolver-comment">
                    {selectedStatus === 'Resolved' ? <>Resolution notes <span className="required">*</span></> :
                     selectedStatus === 'Rejected' ? <>Rejection reason <span className="required">*</span></> :
                     <>Notes <span className="optional">(optional)</span></>}
                  </label>
                  <textarea
                    id="resolver-comment"
                    className="form-textarea"
                    rows="4"
                    placeholder={
                      selectedStatus === 'Resolved'
                        ? 'Describe how the issue was resolved…'
                        : selectedStatus === 'Rejected'
                        ? 'Explain why this ticket cannot be processed…'
                        : 'Add investigation notes or status updates…'
                    }
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); setValidationError(''); }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => navigate(deptSlug ? `/resolver/${deptSlug}` : '/resolver')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={actionBtnClass()}
                    disabled={submitting}
                  >
                    {actionBtnLabel()}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
