import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Employee.css';

const NewTicket = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ subject: '', description: '', attachment: null });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In the future, API calls go here.
    setSubmitted(true);
    setTimeout(() => {
      navigate('/employee');
    }, 2000); // Redirect after 2 seconds
  };

  if (submitted) {
    return (
      <div className="employee-layout centered-message">
        <h2>Ticket Submitted Successfully!</h2>
        <p>Redirecting you to the dashboard...</p>
      </div>
    );
  }

  return (
    <div className="employee-layout">
      <header className="employee-header">
        <h1>Create New Ticket</h1>
        <p>Please provide details about your issue</p>
      </header>

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
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="attachment">Attachment (Optional)</label>
          <input 
            type="file" 
            id="attachment"
            onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/employee')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Submit Ticket
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTicket;