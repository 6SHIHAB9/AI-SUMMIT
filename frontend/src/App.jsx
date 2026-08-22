import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import NewTicket from './pages/NewTicket.jsx';
import TicketDetails from './pages/TicketDetails.jsx';
import ReviewerDashboard from './pages/ReviewerDashboard.jsx';
import ResolverDashboard from './pages/ResolverDashboard.jsx';
import ResolverDepartmentTickets from './pages/ResolverDepartmentTickets.jsx';
import ResolverTicketDetails from './pages/ResolverTicketDetails.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/employee/new-ticket" element={<NewTicket />} />
      <Route path="/employee/ticket/:ticketId" element={<TicketDetails />} />
      <Route path="/review" element={<ReviewerDashboard />} />
      <Route path="/resolver" element={<ResolverDashboard />} />
      <Route path="/resolver/:departmentSlug" element={<ResolverDepartmentTickets />} />
      <Route path="/resolver/ticket/:ticketId" element={<ResolverTicketDetails />} />
    </Routes>
  );
}

export default App;