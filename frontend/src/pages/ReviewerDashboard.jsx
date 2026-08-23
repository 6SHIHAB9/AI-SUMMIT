import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DEPARTMENTS } from '../utils/departments.js';
import { PRIORITIES, URGENCIES, SENTIMENTS } from '../utils/priorities.js';

const ReviewerDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchPendingTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/tickets/review');
      if (!res.ok) throw new Error('Failed to fetch pending tickets');
      setTickets(await res.json());
    } catch {
      setError('Unable to load pending tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingTickets(); }, []);

  const openModal = (type, ticket) => {
    setActiveModal(type);
    setSelectedTicket(ticket);
    setModalError('');
    if (type === 'reject') {
      setFormData({ reason: '' });
    } else if (type === 'approve') {
      setFormData({
        routed_to: '',
        category: ticket.category && ticket.category !== 'General' ? ticket.category : '',
        sub_category: ticket.sub_category && ticket.sub_category !== 'General Inquiry' ? ticket.sub_category : '',
        priority: ticket.priority || 'Medium',
        urgency: ticket.urgency || 'Medium',
        sentiment: ticket.sentiment || 'Neutral',
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTicket(null);
    setFormData({});
    setModalError('');
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setModalError('');
    if (activeModal === 'approve' && !formData.routed_to) {
      setModalError('You must select a department before approving.');
      return;
    }
    setIsProcessing(true);
    const { ticket_id } = selectedTicket;
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticket_id}/${activeModal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData }),
      });
      if (!res.ok) throw new Error(`Failed to ${activeModal} ticket.`);
      await fetchPendingTickets();
      closeModal();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page">
      <nav className="topbar">
        <Link to="/" className="topbar__logo">
          <span className="topbar__logo-dot" style={{ background: 'var(--accent-reviewer)' }} />
          IT Helpdesk
        </Link>
        <div className="topbar__divider" />
        <span className="topbar__section">Human Review</span>
        <div className="topbar__spacer" />
        {!loading && tickets.length > 0 && (
          <span className="stat-chip stat-chip--active" style={{ marginRight: '0.4rem' }}>
            {tickets.length} pending
          </span>
        )}
        <Link to="/" className="topbar__nav-back">← Home</Link>
      </nav>

      <div className="main-content main-content--wide">
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Pending Review Queue</h1>
            <p className="page-header__subtitle">Tickets flagged for human oversight — review and approve or reject.</p>
          </div>
        </div>

        {loading && (
          <div className="ticket-list">
            {[1,2].map(i => (
              <div key={i} style={{ padding: '1.1rem 1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div className="skeleton skeleton-line skeleton-line--short" />
                <div className="skeleton skeleton-line skeleton-line--full" style={{ marginTop: '0.5rem' }} />
                <div className="skeleton skeleton-line skeleton-line--medium" style={{ marginTop: '0.5rem' }} />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="alert alert--error">{error}</div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">✅</div>
            <div className="empty-state__title">All clear</div>
            <div className="empty-state__body">No tickets are currently pending human review.</div>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <div key={ticket.ticket_id} className="review-card">
                {/* Card header */}
                <div className="review-card__header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                      {ticket.ticket_id} · {formatDate(ticket.created_at)}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ticket.subject}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{ticket.raised_by}</div>
                  </div>
                  <span className="badge badge--review">Pending Review</span>
                </div>

                {/* Description */}
                <div className="review-card__description">{ticket.description}</div>

                {/* Metadata */}
                <div className="review-card__meta-grid">
                  {[
                    ['Category',    ticket.category || '—'],
                    ['Sub-category',ticket.sub_category || '—'],
                    ['Priority',    ticket.priority || '—'],
                    ['Urgency',     ticket.urgency || '—'],
                    ['Sentiment',   ticket.sentiment || '—'],
                    ['Confidence',  ticket.confidence ? `${Math.round(ticket.confidence * 100)}%` : '—'],
                  ].map(([label, val]) => (
                    <div className="review-card__meta-cell" key={label}>
                      <div className="review-card__meta-label">{label}</div>
                      <div className="review-card__meta-value">{val}</div>
                    </div>
                  ))}
                </div>

                {/* Reason for review */}
                <div className="review-card__reason">
                  <strong>Reason for Review:</strong> {ticket.approval_reason}
                </div>

                {/* Attachment */}
                {ticket.attachment && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <strong>Attachment:</strong> {ticket.attachment}
                  </div>
                )}

                {/* Actions */}
                <div className="review-card__actions">
                  <button className="btn btn--success" onClick={() => openModal('approve', ticket)}>
                    ✓ Approve &amp; Route
                  </button>
                  <button className="btn btn--danger" onClick={() => openModal('reject', ticket)}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">
                {activeModal === 'reject' ? 'Reject Ticket' : 'Approve & Route Ticket'}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8em', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  {selectedTicket?.ticket_id}
                </span>
              </h2>
              <button className="modal__close" onClick={closeModal} aria-label="Close">&times;</button>
            </div>

            {modalError && (
              <div className="alert alert--error" style={{ marginBottom: '1rem' }}>⚠ {modalError}</div>
            )}

            <form onSubmit={handleAction}>
              {activeModal === 'reject' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="reject-reason">
                    Rejection reason <span className="required">*</span>
                  </label>
                  <textarea
                    id="reject-reason"
                    required
                    rows="4"
                    className="form-textarea"
                    placeholder="Explain why this ticket is being rejected…"
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              )}

              {activeModal === 'approve' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="route-to">
                      Route to department <span className="required">*</span>
                    </label>
                    <select
                      id="route-to"
                      required
                      className="form-select"
                      value={formData.routed_to}
                      onChange={(e) => {
                        const dept = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          routed_to: dept,
                          category: !prev.category || prev.category === 'General' ? dept : prev.category,
                          sub_category: !prev.sub_category || prev.sub_category === 'General Inquiry' ? `${dept} General` : prev.sub_category,
                        }));
                      }}
                    >
                      <option value="" disabled>— Select department —</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" htmlFor="approve-category">
                        Category <span className="required">*</span>
                      </label>
                      <input
                        id="approve-category"
                        type="text"
                        required
                        className="form-input"
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. IT Support"
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" htmlFor="approve-subcategory">
                        Sub-category <span className="required">*</span>
                      </label>
                      <input
                        id="approve-subcategory"
                        type="text"
                        required
                        className="form-input"
                        value={formData.sub_category || ''}
                        onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                        placeholder="e.g. Password Reset"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" htmlFor="approve-priority">Priority</label>
                      <select
                        id="approve-priority"
                        className="form-select"
                        value={formData.priority || 'Medium'}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" htmlFor="approve-urgency">Urgency</label>
                      <select
                        id="approve-urgency"
                        className="form-select"
                        value={formData.urgency || 'Medium'}
                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      >
                        {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="approve-sentiment">Sentiment</label>
                    <select
                      id="approve-sentiment"
                      className="form-select"
                      value={formData.sentiment || 'Neutral'}
                      onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                    >
                      {SENTIMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={closeModal} disabled={isProcessing}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={activeModal === 'reject' ? 'btn btn--danger btn--lg' : 'btn btn--success btn--lg'}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? 'Processing…'
                    : activeModal === 'reject'
                    ? 'Confirm Rejection'
                    : 'Confirm & Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboard;