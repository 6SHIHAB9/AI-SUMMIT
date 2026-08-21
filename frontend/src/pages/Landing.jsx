import { useNavigate } from 'react-router-dom'
import './Landing.css'

const ROLES = [
  {
    icon: '👤',
    title: 'Employee',
    description: 'Raise a request and track it through to resolution.',
    path: '/employee',
    accent: 'employee',
  },
  {
    icon: '🎫',
    title: 'Ticket Resolver',
    description: 'Pick up incoming tickets and work them to a close.',
    path: '/resolver',
    accent: 'resolver',
  },
  {
    icon: '🛡️',
    title: 'Human-in-the-Loop Reviewer',
    description: 'Review flagged tickets and approve, modify, or reject them when human oversight is required.',
    path: '/review',
    accent: 'reviewer',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <div className="landing__glow landing__glow--one" aria-hidden="true" />
      <div className="landing__glow landing__glow--two" aria-hidden="true" />
      <div className="landing__grid" aria-hidden="true" />

      <main className="landing__content">
        <header className="landing__header">
          <p className="landing__eyebrow">Enterprise Support System</p>
          <h1 className="landing__title">Intelligent Helpdesk</h1>
          <p className="landing__subtitle">AI-Powered Employee Support System</p>
        </header>

        <h2 className="landing__choose">Choose your role</h2>

        <div className="role-grid">
          {ROLES.map((role) => (
            <button
              key={role.path}
              type="button"
              className={`role-card role-card--${role.accent}`}
              onClick={() => navigate(role.path)}
            >
              <span className="role-card__icon">{role.icon}</span>
              <span className="role-card__title">{role.title}</span>
              <span className="role-card__description">{role.description}</span>
              <span className="role-card__path">{role.path}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
