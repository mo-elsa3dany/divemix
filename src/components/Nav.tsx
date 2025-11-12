'use client';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'DiveMix' },
  { href: '/planner', label: 'Planner' },
  { href: '/nitrox', label: 'Nitrox' },
  { href: '/trimix', label: 'Trimix' },
  { href: '/saved', label: 'Saved' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/status', label: 'Status' },
];

export default function Nav() {
  const pathname = usePathname() || '/';
  return (
    <header className="nav-wrap">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <a
            key={l.href}
            href={l.href}
            className={active ? 'nav-link-active' : 'nav-link'}
          >
            {l.label}
          </a>
        );
      })}
    </header>
  );
}
