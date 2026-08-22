import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Employee.css';
import { DEPARTMENTS } from '../utils/departments.js';
import { PRIORITIES, URGENCIES, SENTIMENTS } from '../utils/priorities.js';

const ReviewerDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeModal, setActiveModal] = useState(null); // 'approve' | 'reject' | null
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPendingTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/tickets/review');
      if (!response.ok) throw new Error('Failed to fetch pending tickets');
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError('Unable to load pending tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  const openModal = (type, ticket) => {
    setActiveModal(type);
    setSelectedTicket(ticket);
    if (type === 'reject') {
      setFormData({ reason: '' });
    } else if (type === 'approve') {
      setFormData({
        routed_to: '',           // blank — reviewer MUST select a department
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
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    const { ticket_id } = selectedTicket;
    
    let url = `http://localhost:8000/tickets/${ticket_id}/${activeModal}`;
    let payload = { ...formData };

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Failed to ${activeModal} ticket.`);
      
      await fetchPendingTickets();
      closeModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    padding: '1rem'
  };
  
  const modalStyle = {
    background: '#1e293b', padding: '2rem', borderRadius: '8px', 
    width: '100%', maxWidth: '540px', border: '1px solid #334155', color: '#f8fafc',
    maxHeight: '90vh', overflowY: 'auto'
  };

  const selectStyle = {
    width: '100%', padding: '0.6rem', borderRadius: '4px',
    background: '#0f172a', border: '1px solid #334155', color: 'white', fontSize: '0.95rem'
  };

  const inputStyle = {
    width: '100%', padding: '0.6rem', background: '#0f172a', color: 'white',
    border: '1px solid #334155', borderRadius: '4px', fontSize: '0.95rem'
  };

  return (
    <div className="employee-layout">
      <header className="employee-header">
        <div className="header-titles">
          <h1 style={{ color: '#fca5a5' }}>Human-in-the-Loop Review</h1>
          <p>Review tickets requiring human approval before they can proceed.</p>
        </div>
      </header>

      <section className="tickets-section">
        {loading && <p className="centered-message">Loading pending tickets...</p>}
        {error && <p className="centered-message" style={{ color: '#fca5a5' }}>{error}</p>}
        
        {!loading && !error && tickets.length === 0 && (
          <div className="centered-message" style={{ marginTop: '2rem' }}>
            <h3>No tickets pending review!</h3>
            <p style={{ color: '#94a3b8' }}>Queue is cleared.</p>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <div key={ticket.ticket_id} className="ticket-card" style={{ cursor: 'default', borderLeft: '4px solid #f87171' }}>
                <div className="ticket-card-top">
                  <span className="ticket-id">{ticket.ticket_id}</span>
                  <span className="ticket-date">{ticket.created_at ? ticket.created_at.split('T')[0] : ''}</span>
                </div>
                
                <h3 className="ticket-subject" style={{ marginBottom: '0.5rem' }}>{ticket.subject}</h3>
                <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '1.25rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {ticket.description}
                </p>

                {ticket.attachment && (
                  <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                    <strong>Attachment:</strong> {ticket.attachment}
                  </div>
                )}
                
                {/* Full AI and ticket metadata details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  marginBottom: '1.25rem'
                }}>
                  <div><strong style={{ color: '#e2e8f0' }}>Raised By:</strong> {ticket.raised_by}</div>
                  <div><strong style={{ color: '#e2e8f0' }}>Category:</strong> {ticket.category || 'General'}</div>
                  <div><strong style={{ color: '#e2e8f0' }}>Sub-category:</strong> {ticket.sub_category || 'General Inquiry'}</div>
                  <div><strong style={{ color: '#e2e8f0' }}>Priority:</strong> <span style={{ color: ticket.priority === 'Critical' ? '#f87171' : ticket.priority === 'High' ? '#fbbf24' : '#93c5fd' }}>{ticket.priority || 'Medium'}</span></div>
                  <div><strong style={{ color: '#e2e8f0' }}>Urgency:</strong> {ticket.urgency || 'Medium'}</div>
                  <div><strong style={{ color: '#e2e8f0' }}>Sentiment:</strong> {ticket.sentiment || 'Neutral'}</div>
                  <div><strong style={{ color: '#e2e8f0' }}>AI Confidence:</strong> {ticket.confidence ? `${Math.round(ticket.confidence * 100)}%` : 'N/A'}</div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem', lineHeight: 1.4 }}>
                    <strong>Reason for Review:</strong> {ticket.approval_reason}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    className="btn-primary"
                    style={{ background: '#059669', borderColor: '#059669', padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}
                    onClick={() => openModal('approve', ticket)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-primary"
                    style={{ background: '#dc2626', borderColor: '#dc2626', padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}
                    onClick={() => openModal('reject', ticket)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="back-link" style={{ marginTop: '2rem' }}>
        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Back to Home</Link>
      </div>

      {activeModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ marginTop: 0, marginBottom: '1.25rem', color: activeModal === 'reject' ? '#fca5a5' : '#86efac', fontSize: '1.3rem' }}>
              {activeModal === 'reject' ? 'REJECT TICKET' : 'APPROVE & ROUTE TICKET'}: {selectedTicket?.ticket_id}
            </h2>
            
            <form onSubmit={handleAction}>
              {activeModal === 'reject' && (
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Why is this ticket being rejected? *
                  </label>
                  <textarea 
                    required
                    rows="4"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: 'white', fontSize: '0.95rem' }}
                    placeholder="Provide a reason for rejection..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              )}

              {activeModal === 'approve' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Route To *</label>
                    <select
                      required
                      style={{
                        ...selectStyle,
                        color: formData.routed_to ? 'white' : '#64748b'
                      }}
                      value={formData.routed_to}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          routed_to: newDept,
                          category: !prev.category || prev.category === 'General' ? newDept : prev.category,
                          sub_category: !prev.sub_category || prev.sub_category === 'General Inquiry' ? `${newDept} General` : prev.sub_category
                        }));
                      }}
                    >
                      <option value="" disabled>— Select a department —</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Category *</label>
                    <input
                      type="text"
                      required
                      style={inputStyle}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. IT Support / Software Support / Access Management"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Sub-category *</label>
                    <input
                      type="text"
                      required
                      style={inputStyle}
                      value={formData.sub_category}
                      onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                      placeholder="e.g. Password Reset / VPN Issue"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Priority *</label>
                      <select
                        required
                        style={selectStyle}
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Urgency *</label>
                      <select
                        required
                        style={selectStyle}
                        value={formData.urgency}
                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      >
                        {URGENCIES.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Sentiment *</label>
                    <select
                      required
                      style={selectStyle}
                      value={formData.sentiment}
                      onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                    >
                      {SENTIMENTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {!formData.routed_to && (
                    <p style={{ margin: 0, color: '#f87171', fontSize: '0.85rem' }}>
                      ⚠ You must select a department before approving.
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={isProcessing}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: activeModal === 'reject' ? '#dc2626' : '#059669', borderColor: activeModal === 'reject' ? '#dc2626' : '#059669' }}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : activeModal === 'reject' ? 'Confirm Rejection' : 'Confirm & Route Ticket'}
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