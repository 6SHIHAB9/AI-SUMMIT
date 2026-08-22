import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Employee.css';

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
          attachment: formData.attachment ? formData.attachment.name : null
        }),
      });

      if (!response.ok) throw new Error('Failed to submit ticket.');
      
      const data = await response.json();
      setSubmittedTicket(data);
      
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedTicket) {
    return (
      <div className="employee-layout">
        <div className="ticket-detail-card" style={{ marginTop: '2rem' }}>
          <h2 style={{ color: '#86efac', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            TICKET CREATED
          </h2>
          
          <div className="ticket-meta" style={{ display: 'flex', flexWrap: 'wrap', rowGap: '1rem', marginBottom: '2rem' }}>
            <p style={{ width: '45%', margin: 0 }}><strong>Ticket ID:</strong> {submittedTicket.ticket_id}</p>
            <p style={{ width: '45%', margin: 0 }}><strong>Subject:</strong> {submittedTicket.subject}</p>
            <p style={{ width: '45%', margin: 0 }}><strong>Category:</strong> {submittedTicket.category || 'N/A'}</p>
            <p style={{ width: '45%', margin: 0 }}><strong>Sub-category:</strong> {submittedTicket.sub_category || 'N/A'}</p>
            <p style={{ width: '45%', margin: 0 }}><strong>Priority:</strong> {submittedTicket.priority || 'N/A'}</p>
            <p style={{ width: '100%', margin: 0 }}><strong>Routed To:</strong> {submittedTicket.routed_to || 'Unassigned'}</p>
          </div>

          {submittedTicket.status === 'AI Processing Failed' && (
             <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '1.5rem' }}>
               <h3 style={{ color: '#fca5a5', margin: '0 0 0.5rem 0' }}>AI Processing Failed</h3>
               <p style={{ margin: 0, color: '#f8fafc' }}>The ticket was saved securely, but the AI failed to analyze it. It will be routed manually.</p>
             </div>
          )}

          {submittedTicket.human_approval_required ? (
             <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '1.5rem' }}>
               <h3 style={{ color: '#fca5a5', margin: '0 0 0.5rem 0' }}>HUMAN REVIEW REQUIRED</h3>
               <p style={{ margin: 0, color: '#f8fafc' }}><strong>Reason:</strong> {submittedTicket.approval_reason}</p>
             </div>
          ) : submittedTicket.suggested_resolution ? (
             <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '1.5rem' }}>
               <h3 style={{ color: '#93c5fd', margin: '0 0 0.5rem 0' }}>AI Suggested Resolution</h3>
               <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#f8fafc' }}>{submittedTicket.suggested_resolution}</p>
             </div>
          ) : null}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/employee')}>
              Back to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-layout">
      <header className="employee-header">
        <div className="header-titles">
          <h1>Create New Ticket</h1>
          <p>Please provide details about your issue</p>
        </div>
      </header>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </div>
      )}

      <form className="ticket-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subject">Subject *</label>
          <input 
            type="text" 
            id="subject" 
            required 
            placeholder="Brief summary of the issue"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea 
            id="description" 
            required 
            rows="5" 
            placeholder="Provide as much detail as possible..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="attachment">Attachment (Optional)</label>
          <input 
            type="file" 
            id="attachment"
            onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/employee')} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Processing via AI...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTicket;