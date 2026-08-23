import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Paperclip, AlertCircle, BookOpen } from 'lucide-react';

const NewTicket = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ subject: '', description: '', attachment: null });
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          attachment: formData.attachment ? formData.attachment.name : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit ticket. Please try again.');
      setSubmittedTicket(await res.json());
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      'Open':           'badge badge--open',
      'Pending Review': 'badge badge--review',
    };
    return map[status] || 'badge badge--neutral';
  };

  // ── Success screen ──
  if (submittedTicket) {
    const {
      ticket_id, subject, category, sub_category, priority, routed_to,
      status, human_approval_required, approval_reason,
      suggested_resolution, kb_message,
    } = submittedTicket;

    return (
      <div className="page">
        <nav className="topbar">
          <Link to="/" className="topbar__logo">
            <div className="topbar__logo-mark">TCS</div>
            IT Helpdesk
          </Link>
          <div className="topbar__divider" />
          <span className="topbar__section">Ticket Created</span>
          <div className="topbar__spacer" />
          <button className="topbar__nav-back" onClick={() => navigate('/employee')}>← My Tickets</button>
        </nav>

        <div className="main-content">
          <div className="alert alert--success" style={{ marginBottom: '1.1rem' }}>
            Ticket <strong>{ticket_id}</strong> submitted successfully.
          </div>

          <div className="ticket-detail">
            <div className="ticket-detail__header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="ticket-detail__id">{ticket_id}</span>
                <h1 className="ticket-detail__title">{subject}</h1>
                <div className="ticket-detail__badges">
                  <span className={statusBadge(status)}>{status}</span>
                </div>
              </div>
            </div>

            <div className="ticket-detail__meta-grid">
              {[
                ['Category',     category || '—'],
                ['Sub-category', sub_category || '—'],
                ['Priority',     priority || '—'],
                ['Routed To',    routed_to || '—'],
              ].map(([label, val]) => (
                <div className="meta-cell" key={label}>
                  <div className="meta-cell__label">{label}</div>
                  <div className="meta-cell__value">{val}</div>
                </div>
              ))}
            </div>

            {human_approval_required && (
              <div className="alert alert--warning">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>Pending Human Review</div>
                  <div>{approval_reason}</div>
                </div>
              </div>
            )}

            {!human_approval_required && suggested_resolution && (
              <div className="resolution-section">
                <div className="resolution-section__title">Suggested Resolution</div>
                <div className="resolution-section__body markdown-body">
                  <ReactMarkdown>{suggested_resolution}</ReactMarkdown>
                </div>
              </div>
            )}

            {!human_approval_required && !suggested_resolution && (
              <div className="content-section">
                <div className="content-section__title">Resolution</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {kb_message || 'No automated resolution found. A resolver will investigate your ticket.'}
                </div>
              </div>
            )}

            <div>
              <button className="btn btn--primary btn--lg" onClick={() => navigate('/employee')}>
                Back to My Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="page">
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <div className="topbar__logo-mark">TCS</div>
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">New Ticket</span>
        <div className="topbar__spacer" />
        <button className="topbar__nav-back" onClick={() => navigate('/employee')}>← My Tickets</button>
      </nav>

      <div className="main-content" style={{ maxWidth: '620px' }}>
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Submit a Support Ticket</h1>
            <p className="page-header__subtitle">Describe your issue and we'll route it to the right team automatically.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="card" style={{ padding: '1.35rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <input
                id="subject"
                type="text"
                className="form-input"
                required
                placeholder="Brief summary of the issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                className="form-textarea"
                required
                rows="6"
                placeholder="Provide as much detail as possible — steps taken, error messages, affected systems..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                style={{ minHeight: '130px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="attachment">
                <Paperclip size={12} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                Attachment <span className="optional">(optional)</span>
              </label>
              <input
                id="attachment"
                type="file"
                className="form-file-input"
                onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
                disabled={isSubmitting}
              />
              <span className="form-hint">Screenshots, logs, or relevant files</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn--secondary" onClick={() => navigate('/employee')} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--lg" disabled={isSubmitting}>
                {isSubmitting ? 'Processing…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTicket;