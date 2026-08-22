import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './Resolver.css';
import './Employee.css';
import { departmentToSlug } from '../utils/departments.js';

export default function ResolverTicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status update state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [validationError, setValidationError] = useState('');

  const fetchTicket = async () => {
    try {
      const response = await fetch(`http://localhost:8000/resolver/ticket/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ticket not found');
        }
        throw new Error('Failed to load ticket details');
      }
      const data = await response.json();
      setTicket(data);
      setSelectedStatus(data.status || 'Open');
      if (data.resolver_comment) {
        setComment(data.resolver_comment);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setActionSuccess('');

    // Validation for Resolved and Rejected
    if ((selectedStatus === 'Resolved' || selectedStatus === 'Rejected') && !comment.trim()) {
      setValidationError(
        selectedStatus === 'Resolved'
          ? 'A resolution comment is mandatory when resolving a ticket.'
          : 'A rejection reason is mandatory when rejecting a ticket.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/resolver/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update ticket status');
      }

      const updatedTicket = await response.json();
      setTicket(updatedTicket);
      setActionSuccess(`Ticket successfully updated to "${selectedStatus}"!`);
    } catch (err) {
      setValidationError(err.message || 'Failed to update ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'In Progress':
        return 'status-in-progress';
      case 'Open':
        return 'status-open';
      case 'Resolved':
        return 'status-resolved';
      case 'Rejected':
        return 'priority-critical';
      default:
        return 'status-open';
    }
  };

  const getButtonText = () => {
    if (submitting) return 'Saving...';
    if (selectedStatus === 'Resolved') return '✓ Resolve Ticket';
    if (selectedStatus === 'Rejected') return '✕ Reject Ticket';
    if (selectedStatus === 'In Progress') return 'Update to In Progress';
    return 'Update Status';
  };

  const getButtonColor = () => {
    if (selectedStatus === 'Resolved') return '#059669';
    if (selectedStatus === 'Rejected') return '#dc2626';
    if (selectedStatus === 'In Progress') return '#2563eb';
    return '#2563eb';
  };

  if (loading) {
    return (
      <div className="resolver-layout centered-message">
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="resolver-layout centered-message">
        <h2>{error || 'Ticket Not Found'}</h2>
        <button
          className="btn-primary"
          style={{ marginTop: '1.5rem' }}
          onClick={() => navigate('/resolver')}
        >
          Return to Resolver Dashboard
        </button>
      </div>
    );
  }

  const deptSlug = departmentToSlug(ticket.routed_to);

  return (
    <div className="resolver-layout">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          className="btn-back"
          onClick={() => (deptSlug ? navigate(`/resolver/${deptSlug}`) : navigate('/resolver'))}
          style={{
            background: 'none',
            border: 'none',
            color: '#2dd6be',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: 0,
            fontWeight: 600,
          }}
        >
          ← Back to {ticket.routed_to || 'Department'} Queue
        </button>
      </div>

      <div className="resolver-detail-container">
        {/* Ticket Header */}
        <header className="ticket-detail-header" style={{ marginBottom: '1.5rem' }}>
          <div className="title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="resolver-ticket-id">{ticket.ticket_id}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Created: {formatDate(ticket.created_at)}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#ffffff' }}>{ticket.subject}</h1>
          </div>
          <div className="ticket-badges">
            <span className={`badge ${getStatusBadgeClass(ticket.status)}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
              {ticket.status.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Metadata Grid */}
        <div className="resolver-detail-meta-grid">
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">Raised By</span>
            <span className="resolver-meta-value">{ticket.raised_by}</span>
          </div>
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">Routed Department</span>
            <span className="resolver-meta-value" style={{ color: '#2dd6be', fontWeight: 600 }}>
              {ticket.routed_to || 'Unassigned'}
            </span>
          </div>
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">Category</span>
            <span className="resolver-meta-value">{ticket.category || 'N/A'}</span>
          </div>
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">Sub-category</span>
            <span className="resolver-meta-value">{ticket.sub_category || 'N/A'}</span>
          </div>
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">Priority</span>
            <span className="resolver-meta-value">{ticket.priority || 'N/A'}</span>
          </div>
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">Urgency</span>
            <span className="resolver-meta-value">{ticket.urgency || 'N/A'}</span>
          </div>
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">Sentiment</span>
            <span className="resolver-meta-value">{ticket.sentiment || 'N/A'}</span>
          </div>
          <div className="resolver-meta-item">
            <span className="resolver-meta-label">AI Confidence</span>
            <span className="resolver-meta-value">
              {ticket.confidence ? `${Math.round(ticket.confidence * 100)}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Ticket Description */}
        <h3 className="resolver-section-title">Ticket Description</h3>
        <div className="resolver-description-box">
          {ticket.description}
        </div>

        {/* Attachment if present */}
        {ticket.attachment && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#94a3b8', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Attachment</h4>
            <p style={{ color: '#f1f5f9', margin: 0 }}>{ticket.attachment}</p>
          </div>
        )}

        {/* AI Suggested Resolution */}
        {ticket.suggested_resolution && (
          <div className="resolver-ai-box" style={{ margin: '1.5rem 0' }}>
            <h4>🤖 AI Suggested Troubleshooting Resolution</h4>
            <p>{ticket.suggested_resolution}</p>
          </div>
        )}

        {/* Previous Resolver Comment History */}
        {ticket.resolver_comment && ticket.status !== 'Rejected' && ticket.status !== 'Resolved' && (
          <div style={{
            background: 'rgba(45, 214, 190, 0.08)',
            border: '1px solid rgba(45, 214, 190, 0.25)',
            borderRadius: '8px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ color: '#2dd6be', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Current Resolver Notes</h4>
            <p style={{ margin: 0, color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>{ticket.resolver_comment}</p>
          </div>
        )}

        {/* Resolver Status Actions Panel */}
        <div className="resolver-action-card">
          <h3 className="resolver-action-title">
            ⚙️ Update Ticket Status
          </h3>

          {actionSuccess && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#86efac',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>✓ {actionSuccess}</span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                onClick={() => navigate(deptSlug ? `/resolver/${deptSlug}` : '/resolver')}
              >
                Back to Queue
              </button>
            </div>
          )}

          {validationError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '1.5rem'
            }}>
              ⚠ {validationError}
            </div>
          )}

          <form onSubmit={handleStatusSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontWeight: 600 }}>
                Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: '#0b0f1a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontWeight: 600 }}>
                {selectedStatus === 'Resolved'
                  ? 'Resolution / Comments (Mandatory):'
                  : selectedStatus === 'Rejected'
                  ? 'Rejection Reason (Mandatory):'
                  : selectedStatus === 'In Progress'
                  ? 'Investigation / Progress Notes (Optional / Encouraged):'
                  : 'Resolver Comments (Optional):'}
              </label>
              <textarea
                rows="4"
                placeholder={
                  selectedStatus === 'Resolved'
                    ? 'Describe how the issue was resolved (e.g., VPN configuration was reset and connection verified)...'
                    : selectedStatus === 'Rejected'
                    ? 'Explain why this ticket cannot be processed (e.g., Duplicate ticket, out of department scope)...'
                    : 'Enter status updates or notes...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: '#0b0f1a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => (deptSlug ? navigate(`/resolver/${deptSlug}`) : navigate('/resolver'))}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ background: getButtonColor(), borderColor: getButtonColor() }}
                disabled={submitting}
              >
                {getButtonText()}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
