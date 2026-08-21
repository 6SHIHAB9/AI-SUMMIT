import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockTickets } from '../utils/mockData';
import './Employee.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();

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
        <div className="ticket-list">
          {mockTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="ticket-card"
              onClick={() => navigate(`/employee/ticket/${ticket.id}`)}
            >
              <div className="ticket-card-top">
                <span className="ticket-id">{ticket.id}</span>
                <span className="ticket-date">{ticket.date}</span>
              </div>
              <h3 className="ticket-subject">{ticket.subject}</h3>
              <div className="ticket-card-bottom">
                <div className="ticket-badges">
                  <span className={`badge status-${ticket.status.replace(/\s+/g, '-').toLowerCase()}`}>
                    {ticket.status}
                  </span>
                  <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority} Priority
                  </span>
                </div>
                <span className="ticket-department">{ticket.department}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="back-link">
        <Link to="/">← Back to Home</Link>
      </div>
    </div>
  );
};

export default EmployeeDashboard;