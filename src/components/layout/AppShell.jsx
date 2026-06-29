/** App shell — header, sidebar, main, footer. */
import { NavBar } from './NavBar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Footer } from './Footer.jsx';

export function AppShell({ children }) {
  return (
    <div className="app">
      <NavBar />
      <div className="shell-body">
        <Sidebar />
        <div className="main">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
