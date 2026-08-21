import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'

function RolePlaceholder({ label }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B0F1A',
        color: '#EEF1F7',
        fontFamily: 'Inter, sans-serif',
        fontSize: '1.1rem',
      }}
    >
      {label} page — coming soon
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/employee" element={<RolePlaceholder label="Employee" />} />
      <Route path="/resolver" element={<RolePlaceholder label="Ticket Resolver" />} />
      <Route path="/review" element={<RolePlaceholder label="Human-in-the-Loop Reviewer" />} />
    </Routes>
  )
}
