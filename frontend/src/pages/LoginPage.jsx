import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div
      style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '16px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width:         '100%',
          maxWidth:      280,
          display:       'flex',
          flexDirection: 'column',
        }}
      >
        <p className="label-caps" style={{ marginBottom: 32 }}>Sign In</p>

        <div style={{ marginBottom: 2 }}>
          <input
            type="email"
            placeholder="Email"
            required
            className="input-editorial"
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 28 }}>
          <input
            type="password"
            placeholder="Password"
            required
            className="input-editorial"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn-primary">
          Sign In
        </button>

        <p
          style={{
            fontSize:      10,
            letterSpacing: '0.05em',
            color:         'var(--secondary)',
            marginTop:     16,
            marginBottom:  0,
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{ color: 'var(--text)', textDecoration: 'underline' }}
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
