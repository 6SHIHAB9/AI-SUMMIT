import { useNavigate } from 'react-router-dom'

const ROLES = [
  {
    icon: '📋',
    title: 'Employee',
    description: 'Submit and track your support tickets.',
    path: '/employee',
    accent: 'employee',
  },
  {
    icon: '🎫',
    title: 'Ticket Resolver',
    description: 'Work assigned tickets to resolution.',
    path: '/resolver',
    accent: 'resolver',
  },
  {
    icon: '🛡️',
    title: 'HITL Reviewer',
    description: 'Review flagged tickets requiring human approval.',
    path: '/review',
    accent: 'reviewer',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <div className="landing__inner">

        <div className="landing__wordmark">
          <span className="landing__wordmark-dot" />
          TCS Enterprise Support
        </div>

        <h1 className="landing__title">IT Helpdesk</h1>
        <p className="landing__subtitle">
          Submit, track, and resolve IT support requests — powered by intelligent classification and routing.
        </p>

        <div className="landing__role-grid">
          {ROLES.map((role) => (
            <button
              key={role.path}
              type="button"
              className="role-card"
              onClick={() => navigate(role.path)}
            >
              <div className={`role-card__accent role-card__accent--${role.accent}`}>
                {role.icon}
              </div>
              <span className="role-card__title">{role.title}</span>
              <span className="role-card__desc">{role.description}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
