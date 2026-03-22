import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const navLinks = []

  const toggleLabel = theme === 'light' ? '☾ Dark' : '☀ Light'

  return (
    <header
      style={{
        position:    'fixed',
        top:         0,
        left:        0,
        right:       0,
        zIndex:      50,
        borderBottom: '1px solid var(--border)',
        background:  'var(--bg)',
      }}
    >
      <nav
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '16px 32px',
          maxWidth:       '1200px',
          margin:         '0 auto',
        }}
      >
        {/* Wordmark */}
        <Link
          to="/"
          reloadDocument
          style={{
            color:          'var(--text)',
            fontWeight:     700,
            fontSize:       '12px',
            letterSpacing:  '0.18em',
            textTransform:  'uppercase',
            textDecoration: 'none',
          }}
        >
          StockSignal
        </Link>

        {/* Desktop links + toggle */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className={`nav-link${location.pathname === to ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            style={{
              background:    'transparent',
              border:        '1px solid var(--text)',
              color:         'var(--text)',
              padding:       '3px 10px',
              fontSize:      '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor:        'pointer',
              fontFamily:    'inherit',
            }}
          >
            {toggleLabel}
          </button>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          style={{
            background:    'none',
            border:        'none',
            padding:       '8px',
            flexDirection: 'column',
            gap:           '5px',
            alignItems:    'center',
            cursor:        'pointer',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display:    'block',
                width:      24,
                height:     2,
                background: 'var(--text)',
              }}
            />
          ))}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className="mobile-menu"
        style={{
          overflow:   'hidden',
          maxHeight:  menuOpen ? '240px' : '0',
          transition: 'max-height 250ms ease',
          background: 'var(--bg)',
          borderTop:  '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display:       'flex',
            flexDirection: 'column',
            padding:       '16px 32px',
            gap:           '16px',
          }}
        >
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => { toggleTheme(); setMenuOpen(false) }}
            style={{
              background:    'transparent',
              border:        '1px solid var(--text)',
              color:         'var(--text)',
              padding:       '6px 10px',
              fontSize:      '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor:        'pointer',
              fontFamily:    'inherit',
              alignSelf:     'flex-start',
            }}
          >
            {toggleLabel}
          </button>
        </div>
      </div>
    </header>
  )
}
