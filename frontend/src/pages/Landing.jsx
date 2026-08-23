import { useNavigate } from 'react-router-dom'
import { User, Ticket, ShieldCheck } from 'lucide-react'

const ROLES = [
  {
    Icon: User,
    title: 'Employee',
    description: 'Submit and track your support tickets.',
    path: '/employee',
    accent: 'employee',
  },
  {
    Icon: Ticket,
    title: 'Ticket Resolver',
    description: 'Work assigned tickets through to resolution.',
    path: '/resolver',
    accent: 'resolver',
  },
  {
    Icon: ShieldCheck,
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
      {/* Top nav bar */}
      <header className="landing__topbar">
        <div className="landing__logo-mark">TCS</div>
        <span className="landing__logo-text">IT Helpdesk</span>
        <span className="landing__logo-org">Enterprise Support Platform</span>
      </header>

      {/* Body */}
      <div className="landing__body">
        <div className="landing__inner">
          <div className="landing__heading-block">
            <div className="landing__org-label">TCS Enterprise Support</div>
            <h1 className="landing__title">IT Helpdesk</h1>
            <p className="landing__subtitle">
              Submit, track, and resolve IT support requests — with intelligent classification and routing.
            </p>
          </div>

          <div className="landing__role-label">Select your workspace</div>
          <div className="landing__role-grid">
            {ROLES.map(({ Icon, title, description, path, accent }) => (
              <button
                key={path}
                type="button"
                className="role-card"
                onClick={() => navigate(path)}
              >
                <div className={`role-card__icon-wrap role-card__icon-wrap--${accent}`}>
                  <Icon size={16} strokeWidth={2} />
                </div>
                <span className="role-card__title">{title}</span>
                <span className="role-card__desc">{description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
