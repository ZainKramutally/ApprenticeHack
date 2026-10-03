import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomBar, Sidebar } from './components/Sidebar';
import { useCurrentUser } from './context/AppState';
import Chats from './pages/Chats';
import CreateEvent from './pages/CreateEvent';
import Discover from './pages/Discover';
import EventPage from './pages/EventPage';
import Favourites from './pages/Favourites';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Report from './pages/Report';
import Search from './pages/Search';
import Welcome from './pages/Welcome';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // e.g. /profile#privacy: wait for the page to render, then jump to the section.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** App chrome (rail / bottom bar) for signed-in screens; sends signed-out visitors to /welcome. */
function Shell({ children, organiserOnly, fullHeight }: { children: ReactNode; organiserOnly?: boolean; fullHeight?: boolean }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/welcome" replace />;
  if (organiserOnly && user.role !== 'organiser') return <Navigate to="/" replace />;
  return (
    <>
      <Sidebar />
      <main
        className={
          fullHeight
            ? 'h-dvh pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0 md:pl-[72px]'
            : 'min-h-screen pb-24 md:pb-10 md:pl-[72px] print:p-0!'
        }
      >
        {children}
      </main>
      <BottomBar />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Shell><Discover /></Shell>} />
        <Route path="/event/:id" element={<Shell><EventPage /></Shell>} />
        <Route path="/search" element={<Shell><Search /></Shell>} />
        <Route path="/chats" element={<Shell fullHeight><Chats /></Shell>} />
        <Route path="/chats/:eventId" element={<Shell fullHeight><Chats /></Shell>} />
        <Route path="/favourites" element={<Shell><Favourites /></Shell>} />
        <Route path="/profile" element={<Shell><Profile /></Shell>} />
        <Route path="/report" element={<Shell><Report /></Shell>} />
        <Route path="/create" element={<Shell organiserOnly><CreateEvent /></Shell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
