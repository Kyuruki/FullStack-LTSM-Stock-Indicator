import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import BackgroundCanvas from './BackgroundCanvas'
import CustomCursor from './CustomCursor'
import Navbar from './Navbar'

export default function Layout() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <>
      <CustomCursor />
      <BackgroundCanvas theme={theme} />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main key={location.pathname} className="page-fade-in" style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
    </>
  )
}
