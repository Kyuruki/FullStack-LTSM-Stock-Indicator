import { Link, useNavigate } from 'react-router-dom'

export default function SignUpPage() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/')
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
        <p className="label-caps" style={{ marginBottom: 32 }}>Create Account</p>

        <div style={{ marginBottom: 2 }}>
          <input
            type="email"
            placeholder="Email"
            required
            className="input-editorial"
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 2 }}>
          <input
            type="password"
            placeholder="Password"
            required
            className="input-editorial"
            autoComplete="new-password"
          />
        </div>
        <div style={{ marginBottom: 28 }}>
          <input
            type="password"
            placeholder="Confirm Password"
            required
            className="input-editorial"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-primary">
          Create Account
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
          Already have an account?{' '}
          <Link
            to="/"
            style={{ color: 'var(--text)', textDecoration: 'underline' }}
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
