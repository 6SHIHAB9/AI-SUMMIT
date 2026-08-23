import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { departmentToSlug } from '../utils/departments.js';
import { AlertCircle, CheckCircle2, XCircle, BookOpen } from 'lucide-react';

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
      if (!res.ok) throw new Error(res.status === 404 ? 'Ticket not found' : 'Failed to load ticket details');
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
          <Link to="/" className="topbar__logo"><div className="topbar__logo-mark">TCS</div>IT Helpdesk</Link>
          <div className="topbar__divider" />
          <span className="topbar__section">Ticket Resolver</span>
        </nav>
        <div className="main-content">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-line skeleton-line--full" style={{ marginBottom: '0.6rem', height: '1.1rem' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page">
        <nav className="topbar">
          <Link to="/" className="topbar__logo"><div className="topbar__logo-mark">TCS</div>IT Helpdesk</Link>
          <div className="topbar__divider" />
          <span className="topbar__section">Ticket Resolver</span>
          <div className="topbar__spacer" />
          <button className="topbar__nav-back" onClick={() => navigate('/resolver')}>← Departments</button>
        </nav>
        <div className="main-content">
          <div className="empty-state">
            <div className="empty-state__icon"><AlertCircle size={18} strokeWidth={1.5} /></div>
            <div className="empty-state__title">{error || 'Ticket not found'}</div>
            <button className="btn btn--secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/resolver')}>← Resolver Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

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
                  <span className="badge badge--neutral">{ticket.urgency} urgency</span>
                )}
              </div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="ticket-detail__meta-grid">
            {[
              ['Raised By',    ticket.raised_by],
              ['Routed To',    ticket.routed_to || '—'],
              ['Category',     ticket.category || '—'],
              ['Sub-category', ticket.sub_category || '—'],
              ['Priority',     ticket.priority || '—'],
              ['Urgency',      ticket.urgency || '—'],
              ['Sentiment',    ticket.sentiment || '—'],
              ['Confidence',   ticket.confidence ? `${Math.round(ticket.confidence * 100)}%` : '—'],
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
              <div style={{ marginTop: '0.5rem' }}>
                <img
                  src={`http://localhost:8000/uploads/${ticket.attachment}`}
                  alt="Attachment"
                  onClick={(e) => {
                    const overlay = document.createElement('div');
                    overlay.className = 'modal-overlay';
                    overlay.style.zIndex = '9999';
                    overlay.onclick = () => document.body.removeChild(overlay);
                    
                    const img = document.createElement('img');
                    img.src = e.target.src;
                    img.style.maxWidth = '90vw';
                    img.style.maxHeight = '90vh';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = 'var(--radius-md)';
                    img.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.5)';
                    
                    overlay.appendChild(img);
                    document.body.appendChild(overlay);
                  }}
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', cursor: 'zoom-in' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                />
                <div style={{ display: 'none', fontSize: '0.83rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {ticket.attachment} (Image unavailable)
                </div>
              </div>
            </div>
          )}

          {/* Suggested Resolution */}
          {ticket.suggested_resolution ? (
            <div className="resolution-section">
              <div className="resolution-section__title">Suggested Resolution</div>
              <div className="resolution-section__body markdown-body">
                <ReactMarkdown>{ticket.suggested_resolution}</ReactMarkdown>
              </div>
              {kbSources && kbSources.length > 0 && (
                <div className="resolution-section__sources">
                  <div className="resolution-section__sources-label">References</div>
                  {kbSources.map((s, i) => (
                    <span key={i} className="resolution-section__source-item">
                      <BookOpen size={10} />
                      {s.source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="content-section">
              <div className="content-section__title">Suggested Resolution</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {ticket.kb_message || 'No automated resolution found in the Knowledge Base.'}
              </div>
            </div>
          )}

          {/* In-progress notes */}
          {ticket.resolver_comment && ticket.status === 'In Progress' && (
            <div className="alert alert--info">
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.15rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Resolver Notes</div>
                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{ticket.resolver_comment}</div>
              </div>
            </div>
          )}

          {/* Terminal state alerts */}
          {ticket.status === 'Resolved' && (
            <div className="alert alert--success">
              <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>Resolved</div>
                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{ticket.resolver_comment || 'Ticket has been resolved.'}</div>
              </div>
            </div>
          )}

          {ticket.status === 'Rejected' && (
            <div className="alert alert--error">
              <XCircle size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>Rejected</div>
                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{ticket.resolver_comment || 'Ticket has been rejected.'}</div>
              </div>
            </div>
          )}

          {/* Action panel — only for non-terminal tickets */}
          {!isTerminal && (
            <div className="action-panel">
              <div className="action-panel__title">Update Ticket</div>

              {actionSuccess && (
                <div className="alert alert--success" style={{ marginBottom: '1rem' }}>
                  <CheckCircle2 size={14} />
                  <span style={{ flex: 1 }}>{actionSuccess}</span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => navigate(deptSlug ? `/resolver/${deptSlug}` : '/resolver')}
                  >
                    Back to Queue
                  </button>
                </div>
              )}

              {validationError && (
                <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={14} />
                  {validationError}
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
                      selectedStatus === 'Resolved' ? 'Describe how the issue was resolved…'
                      : selectedStatus === 'Rejected' ? 'Explain why this ticket cannot be processed…'
                      : 'Add investigation notes or status updates…'
                    }
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); setValidationError(''); }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn--ghost" onClick={() => navigate(deptSlug ? `/resolver/${deptSlug}` : '/resolver')} disabled={submitting}>Cancel</button>
                  <button type="submit" className={actionBtnClass()} disabled={submitting}>{actionBtnLabel()}</button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
