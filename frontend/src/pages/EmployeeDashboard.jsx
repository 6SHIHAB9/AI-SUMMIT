import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Employee.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:8000/tickets');
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        const data = await response.json();
        
        const filteredTickets = data.filter(
          (ticket) => ticket.raised_by === 'employee@tcs.com'
        );
        setTickets(filteredTickets);
      } catch (err) {
        setError('Unable to load tickets. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
  };

  return (
    <div className="employee-layout">
      <header className="employee-header">
        <div className="header-titles">
          <h1>Employee Dashboard</h1>
          <p>View and manage your support requests</p>
        </div>
        <button 
          className="btn-primary new-ticket-btn"
          onClick={() => navigate('/employee/new-ticket')}
        >
          + New Ticket
        </button>
      </header>

      <section className="tickets-section">
        <h2>My Tickets</h2>

        {loading && (
          <div className="centered-message" style={{ marginTop: '2rem' }}>
            <p>Loading tickets...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '1rem', borderRadius: '6px', margin: '1rem 0', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="centered-message" style={{ marginTop: '2rem' }}>
            <h3>No tickets yet</h3>
            <button 
              className="btn-primary" 
              style={{ marginTop: '1rem' }}
              onClick={() => navigate('/employee/new-ticket')}
            >
              + Create Your First Ticket
            </button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <div 
                key={ticket.ticket_id} 
                className="ticket-card"
                onClick={() => navigate(`/employee/ticket/${ticket.ticket_id}`)}
              >
                <div className="ticket-card-top">
                  <span className="ticket-id">{ticket.ticket_id}</span>
                  <span className="ticket-date">{formatDate(ticket.created_at)}</span>
                </div>
                
                <h3 className="ticket-subject">{ticket.subject}</h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  <span><strong>Category:</strong> {ticket.category || 'N/A'} {ticket.sub_category && `(${ticket.sub_category})`}</span>
                  <span><strong>Priority:</strong> {ticket.priority || 'N/A'}</span>
                  <span><strong>Urgency:</strong> {ticket.urgency || 'N/A'}</span>
                  <span><strong>Sentiment:</strong> {ticket.sentiment || 'N/A'}</span>
                </div>

                <div className="ticket-card-bottom">
                  <div className="ticket-badges">
                    <span className={`badge status-${ticket.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {ticket.status}
                    </span>
                    {ticket.human_approval_required && ticket.status === 'Pending Review' ? (
                      <span className="badge" style={{ background: '#7f1d1d', color: '#fca5a5' }}>HUMAN REVIEW REQUIRED</span>
                    ) : null}
                  </div>
                  <span className="ticket-department">
                    {ticket.routed_to || 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="back-link" style={{ marginTop: '2rem' }}>
        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    </div>
  );
};

export default EmployeeDashboard;