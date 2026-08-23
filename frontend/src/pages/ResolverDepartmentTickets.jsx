import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './Resolver.css';
import './Employee.css';
import { slugToDepartment, DEPARTMENT_ICONS } from '../utils/departments.js';

export default function ResolverDepartmentTickets() {
  const { departmentSlug } = useParams();
  const navigate = useNavigate();
  const departmentName = slugToDepartment(departmentSlug);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/resolver/tickets/${departmentSlug}`);
        if (!response.ok) {
          throw new Error('Failed to load tickets for this department');
        }
        const data = await response.json();
        // Defensive filter ensuring only Open or In Progress tickets appear
        const activeTickets = data.filter(
          (t) => t.status === 'Open' || t.status === 'In Progress'
        );
        setTickets(activeTickets);
      } catch (err) {
        setError('Unable to load department tickets.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [departmentSlug]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
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

  const icon = DEPARTMENT_ICONS[departmentName] || '📁';

  return (
    <div className="resolver-layout">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/resolver"
          className="btn-back"
          style={{ color: '#2dd6be', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Departments
        </Link>
      </div>

      <header className="resolver-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <h1 style={{ margin: 0 }}>{departmentName} Queue</h1>
          </div>
          <p>Tickets assigned and awaiting support resolution</p>
        </div>
        {!loading && !error && (
          <div className="resolver-badge-count">
            {tickets.length} Active {tickets.length === 1 ? 'Ticket' : 'Tickets'}
          </div>
        )}
      </header>

      <section className="tickets-section">
        {loading && (
          <div className="centered-message">
            <p>Loading queue...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="centered-message" style={{ marginTop: '3rem' }}>
            <h3>No pending tickets</h3>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
              All tickets for {departmentName} have been resolved or rejected.
            </p>
            <button
              className="btn-secondary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => navigate('/resolver')}
            >
              Return to Resolver Landing
            </button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="resolver-ticket-card"
                onClick={() => navigate(`/resolver/ticket/${ticket.ticket_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="resolver-ticket-card-top">
                  <span className="resolver-ticket-id">{ticket.ticket_id}</span>
                  <span className="ticket-date" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                    Created: {formatDate(ticket.created_at)}
                  </span>
                </div>

                <h3 className="resolver-ticket-subject">{ticket.subject}</h3>

                <div className="resolver-meta-row">
                  <span><strong>Raised By:</strong> {ticket.raised_by}</span>
                  <span><strong>Category:</strong> {ticket.category || 'N/A'} {ticket.sub_category && `(${ticket.sub_category})`}</span>
                  <span><strong>Priority:</strong> {ticket.priority || 'N/A'}</span>
                </div>



                <div className="ticket-card-bottom" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #1e293b' }}>
                  <div className="ticket-badges">
                    <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                      {ticket.status.toUpperCase()}
                    </span>
                    {ticket.resolver_comment && (
                      <span className="badge" style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                        Has Resolver Note
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', background: '#2563eb' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/resolver/ticket/${ticket.ticket_id}`);
                    }}
                  >
                    View Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
