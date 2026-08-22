import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import NewTicket from './pages/NewTicket.jsx';
import TicketDetails from './pages/TicketDetails.jsx';
import ReviewerDashboard from './pages/ReviewerDashboard.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/employee/new-ticket" element={<NewTicket />} />
      <Route path="/employee/ticket/:ticketId" element={<TicketDetails />} />
      <Route path="/review" element={<ReviewerDashboard />} />
    </Routes>
  );
}

export default App;