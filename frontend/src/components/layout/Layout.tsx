import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background mesh */}
      <div className="mesh-background" />
      
      {/* Header */}
      <Header />
      
      {/* Main content */}
      <main className="flex-1 pt-24">
        <Outlet />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
