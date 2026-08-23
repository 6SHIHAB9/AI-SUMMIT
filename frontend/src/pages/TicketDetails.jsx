import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './Employee.css';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchTicketDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/tickets/${ticketId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Ticket not found.');
          }
          throw new Error('Failed to load ticket details.');
        }
        const data = await response.json();
        setTicket(data);
      } catch (err) {
        setError(err.message || 'Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
  };

  if (loading) {
    return (
      <div className="employee-layout centered-message">
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="employee-layout centered-message">
        <h2>{error || 'Ticket Not Found'}</h2>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/employee')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="employee-layout">
      <button className="btn-back" onClick={() => navigate('/employee')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '1rem', padding: 0 }}>
        ← Back to Dashboard
      </button>

      <div className="ticket-detail-card">
        <header className="ticket-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
          <div className="title-group">
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>{ticket.subject}</h1>
            <span className="ticket-id" style={{ color: '#94a3b8' }}>{ticket.ticket_id}</span>
          </div>
          <div className="ticket-badges">
            <span className={`badge status-${ticket.status.replace(/\s+/g, '-').toLowerCase()}`}>
              {ticket.status.toUpperCase()}
            </span>
          </div>
        </header>

        <div className="ticket-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', rowGap: '1rem', marginBottom: '2rem' }}>
          <p style={{ width: '45%', margin: 0 }}><strong>Created:</strong> {formatDate(ticket.created_at)}</p>
          <p style={{ width: '45%', margin: 0 }}><strong>Raised By:</strong> {ticket.raised_by}</p>
          <p style={{ width: '45%', margin: 0 }}><strong>Category:</strong> {ticket.category || 'N/A'}</p>
          <p style={{ width: '45%', margin: 0 }}><strong>Sub-category:</strong> {ticket.sub_category || 'N/A'}</p>
          <p style={{ width: '45%', margin: 0 }}><strong>Priority:</strong> {ticket.priority || 'N/A'}</p>
          <p style={{ width: '45%', margin: 0 }}><strong>Urgency:</strong> {ticket.urgency || 'N/A'}</p>
          <p style={{ width: '45%', margin: 0 }}><strong>Sentiment:</strong> {ticket.sentiment || 'N/A'}</p>
          <p style={{ width: '45%', margin: 0 }}><strong>Routed To:</strong> {ticket.routed_to || 'Unassigned'}</p>
        </div>

        <div className="ticket-body">
          <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '1rem' }}>Description</h3>
          <p style={{ color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{ticket.description}</p>
        </div>

        {ticket.status === 'Resolved' && (
          <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)', marginTop: '2rem' }}>
            <h3 style={{ color: '#86efac', marginTop: 0, marginBottom: '0.5rem' }}>✓ Ticket Resolved</h3>
            <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
              <strong>Resolution:</strong> {ticket.resolver_comment || 'The ticket has been resolved by the support team.'}
            </p>
          </div>
        )}

        {ticket.status === 'In Progress' && ticket.resolver_comment && (
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '2rem' }}>
            <h3 style={{ color: '#93c5fd', marginTop: 0, marginBottom: '0.5rem' }}>⚡ Ticket In Progress</h3>
            <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
              <strong>Resolver Update:</strong> {ticket.resolver_comment}
            </p>
          </div>
        )}

        {ticket.status === 'Rejected' && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '2rem' }}>
            <h3 style={{ color: '#fca5a5', marginTop: 0, marginBottom: '0.5rem' }}>✕ Ticket Rejected</h3>
            <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
              <strong>Reason:</strong> {ticket.rejection_reason || ticket.resolver_rejection_reason || ticket.resolver_comment || 'No rejection reason provided.'}
            </p>
          </div>
        )}

        {ticket.human_approval_required && ticket.status === 'Pending Review' && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '2rem' }}>
            <h3 style={{ color: '#fca5a5', marginTop: 0, marginBottom: '0.5rem' }}>Human Approval Required</h3>
            <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>{ticket.approval_reason}</p>
          </div>
        )}

        {!ticket.human_approval_required && ticket.suggested_resolution ? (
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '2rem' }}>
            <h3 style={{ color: '#93c5fd', marginTop: 0, marginBottom: '0.5rem' }}>AI Suggested Resolution</h3>
            <div style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', lineHeight: '1.5' }} className="markdown-body">
              <ReactMarkdown>{ticket.suggested_resolution}</ReactMarkdown>
            </div>
          </div>
        ) : !ticket.human_approval_required && (
          <div style={{ background: 'rgba(100, 116, 139, 0.15)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(100, 116, 139, 0.3)', marginTop: '2rem' }}>
            <h3 style={{ color: '#94a3b8', marginTop: 0, marginBottom: '0.5rem' }}>AI Resolution Unavailable</h3>
            <p style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap' }}>{ticket.kb_message || 'No relevant resolution was found in the Knowledge Base.'}</p>
          </div>
        )}

        {ticket.attachment && (
          <div className="ticket-body" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '0.5rem' }}>Attachment</h3>
            <p style={{ color: '#cbd5e1', margin: 0 }}>{ticket.attachment}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetails;