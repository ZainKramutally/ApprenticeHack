import { Compass, Heart, LogOut, PlusCircle, Search, User, type LucideIcon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp, useCurrentUser } from '../context/AppState';
import { LogoMark, Wordmark } from './Logo';

interface Item {
  to: string;
  label: string;
  Icon: LucideIcon;
}

function useItems(): Item[] {
  const user = useCurrentUser();
  const items: Item[] = [
    { to: '/', label: 'Discover', Icon: Compass },
    { to: '/search', label: 'Search', Icon: Search },
    { to: '/favourites', label: 'Favourites', Icon: Heart },
    { to: '/profile', label: 'Profile', Icon: User },
  ];
  if (user?.role === 'organiser') items.push({ to: '/create', label: 'Create', Icon: PlusCircle });
  return items;
}

/** Desktop: fixed 72px icon rail that widens on hover to show labels. */
export function Sidebar() {
  const items = useItems();
  const { dispatch } = useApp();
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Main"
      className="group fixed inset-y-0 left-0 z-[1050] hidden w-[72px] flex-col border-r border-line bg-white py-4 transition-[width] duration-200 hover:w-56 hover:shadow-xl md:flex print:hidden"
    >
      <NavLink to="/" className="mb-6 flex items-center gap-3 overflow-hidden px-[18px]">
        <span className="shrink-0">
          <LogoMark />
        </span>
        <Wordmark className="whitespace-nowrap text-lg opacity-0 transition-opacity group-hover:opacity-100" />
      </NavLink>
      <ul className="flex flex-1 flex-col gap-1 px-3">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              title={label}
              className={({ isActive }) =>
                `flex h-12 items-center gap-3 overflow-hidden rounded-xl px-[14px] font-semibold transition-colors ${
                  isActive ? 'bg-accent text-white' : 'text-gray-600 hover:bg-stone-100 hover:text-ink'
                }`
              }
            >
              <Icon className="size-[20px] shrink-0" />
              <span className="whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="px-3">
        <button
          type="button"
          title="Switch demo persona"
          onClick={() => {
            dispatch({ type: 'logout' });
            navigate('/welcome');
          }}
          className="flex h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-[14px] text-sm font-medium text-gray-500 hover:bg-stone-100 hover:text-ink"
        >
          <LogOut className="size-[18px] shrink-0" />
          <span className="whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">Switch persona</span>
        </button>
      </div>
    </nav>
  );
}

/** Mobile (< 768px): same items as a bottom tab bar. */
export function BottomBar() {
  const items = useItems();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[1050] flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold ${isActive ? 'text-accent' : 'text-gray-500'}`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex h-8 w-12 items-center justify-center rounded-full ${isActive ? 'bg-accent text-white' : ''}`}>
                <Icon className="size-5" />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
