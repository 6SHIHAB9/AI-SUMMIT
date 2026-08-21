import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockTickets } from '../utils/mockData';
import './Employee.css';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  // Find ticket locally for now
  const ticket = mockTickets.find(t => t.id === ticketId);

  if (!ticket) {
    return (
      <div className="employee-layout centered-message">
        <h2>Ticket Not Found</h2>
        <button className="btn-primary" onClick={() => navigate('/employee')}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="employee-layout">
      <button className="btn-back" onClick={() => navigate('/employee')}>
        ← Back to Dashboard
      </button>

      <div className="ticket-detail-card">
        <header className="ticket-detail-header">
          <div className="title-group">
            <h1>{ticket.subject}</h1>
            <span className="ticket-id">{ticket.id}</span>
          </div>
          <div className="ticket-badges">
            <span className={`badge status-${ticket.status.replace(/\s+/g, '-').toLowerCase()}`}>
              {ticket.status}
            </span>
            <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
              {ticket.priority} Priority
            </span>
          </div>
        </header>

        <div className="ticket-meta">
          <p><strong>Created:</strong> {ticket.date}</p>
          <p><strong>Routed To:</strong> {ticket.department}</p>
        </div>

        <div className="ticket-body">
          <h3>Description</h3>
          <p>{ticket.description}</p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;