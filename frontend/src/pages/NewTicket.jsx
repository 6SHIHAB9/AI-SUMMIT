import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

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
      const response = await fetch('http://localhost:8000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          attachment: formData.attachment ? formData.attachment.name : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit ticket. Please try again.');
      const data = await response.json();
      setSubmittedTicket(data);
      window.scrollTo(0, 0);

    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──
  if (submittedTicket) {
    const { ticket_id, subject, category, sub_category, priority, routed_to,
            status, human_approval_required, approval_reason,
            suggested_resolution, kb_message } = submittedTicket;

    const statusBadge = {
      'Open': { cls: 'badge--open', label: 'Open' },
      'Pending Review': { cls: 'badge--review', label: 'Pending Review' },
    }[status] || { cls: 'badge', label: status };

    return (
      <div className="page">
        <nav className="topbar">
          <Link to="/" className="topbar__logo">
            <span className="topbar__logo-dot" />
            IT Helpdesk
          </Link>
          <div className="topbar__divider" />
          <span className="topbar__section">Ticket Created</span>
          <div className="topbar__spacer" />
          <button className="topbar__nav-back" onClick={() => navigate('/employee')}>
            ← My Tickets
          </button>
        </nav>

        <div className="main-content">
          {/* Success banner */}
          <div className="alert alert--success" style={{ marginBottom: '1.25rem' }}>
            ✓ Ticket <strong>{ticket_id}</strong> submitted successfully.
          </div>

          {/* Ticket header */}
          <div className="ticket-detail__header" style={{ marginBottom: '0.85rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="ticket-detail__id">{ticket_id}</span>
              <h1 className="ticket-detail__title">{subject}</h1>
              <div className="ticket-detail__badges">
                <span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span>
              </div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="ticket-detail__meta-grid" style={{ marginBottom: '0.85rem' }}>
            {[
              ['Category',    category || '—'],
              ['Sub-category',sub_category || '—'],
              ['Priority',    priority || '—'],
              ['Routed To',   routed_to || '—'],
            ].map(([label, val]) => (
              <div className="meta-cell" key={label}>
                <div className="meta-cell__label">{label}</div>
                <div className="meta-cell__value">{val}</div>
              </div>
            ))}
          </div>

          {/* Human review notice */}
          {human_approval_required && (
            <div className="alert alert--warning" style={{ marginBottom: '0.85rem' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Pending Human Review</div>
                <div style={{ fontSize: '0.83rem' }}>{approval_reason}</div>
              </div>
            </div>
          )}

          {/* AI Suggested Resolution */}
          {!human_approval_required && suggested_resolution && (
            <div className="resolution-section" style={{ marginBottom: '0.85rem' }}>
              <div className="resolution-section__title">Suggested Resolution</div>
              <div className="resolution-section__body markdown-body">
                <ReactMarkdown>{suggested_resolution}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* No KB match */}
          {!human_approval_required && !suggested_resolution && (
            <div className="content-section" style={{ marginBottom: '0.85rem' }}>
              <div className="content-section__title">Resolution</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {kb_message || 'No relevant resolution found in the Knowledge Base. A resolver will investigate your ticket.'}
              </div>
            </div>
          )}

          <button className="btn btn--primary btn--lg" onClick={() => navigate('/employee')}>
            Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  // ── New ticket form ──
  return (
    <div className="page">
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <span className="topbar__logo-dot" />
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">New Ticket</span>
        <div className="topbar__spacer" />
        <button className="topbar__nav-back" onClick={() => navigate('/employee')}>
          ← My Tickets
        </button>
      </nav>

      <div className="main-content" style={{ maxWidth: '640px' }}>
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Submit a Support Ticket</h1>
            <p className="page-header__subtitle">Describe your issue and we'll route it to the right team.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: '1.1rem' }}>{error}</div>
        )}

        <div className="card" style={{ padding: '1.5rem' }}>
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
                style={{ minHeight: '140px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="attachment">
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

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => navigate('/employee')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--primary btn--lg"
                disabled={isSubmitting}
              >
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