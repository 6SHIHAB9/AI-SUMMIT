import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import EmployeeDashboard from './pages/EmployeeDashboard';
import NewTicket from './pages/NewTicket';
import TicketDetails from './pages/TicketDetails';

function App() {
  return (
    <Routes>
      {/* Existing Landing Page */}
      <Route path="/" element={<Landing />} />
      
      {/* New Employee Routes */}
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/employee/new-ticket" element={<NewTicket />} />
      <Route path="/employee/ticket/:ticketId" element={<TicketDetails />} />
      
      {/* Placeholder Routes for Future Steps */}
      <Route path="/resolver" element={<div className="placeholder-page"><h2>Ticket Resolver (Coming Soon)</h2></div>} />
      <Route path="/review" element={<div className="placeholder-page"><h2>Human-in-the-Loop Reviewer (Coming Soon)</h2></div>} />
    </Routes>
  );
}

export default App;