import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Employee.css';
import { DEPARTMENTS } from '../utils/departments.js';
import { PRIORITIES } from '../utils/priorities.js';

const ReviewerDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeModal, setActiveModal] = useState(null);
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
    if (type === 'modify') {
      setFormData({
        category: ticket.category || '',
        sub_category: ticket.sub_category || '',
        priority: ticket.priority || '',
      });
    } else if (type === 'reject') {
      setFormData({ reason: '' });
    } else if (type === 'approve') {
      setFormData({ routed_to: '' });
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
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  
  const modalStyle = {
    background: '#1e293b', padding: '2rem', borderRadius: '8px', 
    width: '90%', maxWidth: '500px', border: '1px solid #334155', color: '#f8fafc'
  };

  const selectStyle = {
    width: '100%', padding: '0.5rem', borderRadius: '4px',
    background: '#0f172a', border: '1px solid #334155', color: 'white'
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
                  <span className="ticket-date">{ticket.created_at.split('T')[0]}</span>
                </div>
                
                <h3 className="ticket-subject" style={{ marginBottom: '0.5rem' }}>{ticket.subject}</h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ticket.description}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  <span><strong>Raised By:</strong> {ticket.raised_by}</span>
                  <span><strong>Cat:</strong> {ticket.category || 'N/A'} {ticket.sub_category && `(${ticket.sub_category})`}</span>
                  <span><strong>Priority:</strong> {ticket.priority || 'N/A'}</span>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem' }}>
                    <strong>Reason for Review:</strong> {ticket.approval_reason}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn-primary" style={{ background: '#059669', borderColor: '#059669' }} onClick={() => openModal('approve', ticket)}>Approve</button>
                  <button className="btn-secondary" onClick={() => openModal('modify', ticket)}>Modify</button>
                  <button className="btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={() => openModal('reject', ticket)}>Reject</button>
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
            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: activeModal === 'reject' ? '#fca5a5' : '#86efac' }}>
              {activeModal.toUpperCase()} TICKET: {selectedTicket?.ticket_id}
            </h2>
            
            <form onSubmit={handleAction}>
              {activeModal === 'reject' && (
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Why is this ticket being rejected?</label>
                  <textarea 
                    required rows="4" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                    value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
                </div>
              )}

              {activeModal === 'approve' && (
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Route To:</label>
                  <select
                    required
                    style={selectStyle}
                    value={formData.routed_to}
                    onChange={(e) => setFormData({ ...formData, routed_to: e.target.value })}
                  >
                    <option value="" disabled>Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeModal === 'modify' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Category</label>
                    <input type="text" required style={{ width: '100%', padding: '0.5rem', background: '#0f172a', color: 'white', border: '1px solid #334155' }} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Sub-category</label>
                    <input type="text" required style={{ width: '100%', padding: '0.5rem', background: '#0f172a', color: 'white', border: '1px solid #334155' }} value={formData.sub_category} onChange={(e) => setFormData({...formData, sub_category: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Priority</label>
                    <select
                      required
                      style={selectStyle}
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="" disabled>Select Priority</option>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={isProcessing}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: activeModal === 'reject' ? '#dc2626' : undefined }} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : `Confirm ${activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}`}
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