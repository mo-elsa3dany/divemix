'use client';

import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'DiveMix' },
  { href: '/planner', label: 'Planner' },
  { href: '/mixer', label: 'Mixer' },
  { href: '/trimix', label: 'Trimix' },
  { href: '/saved', label: 'Saved' },
  { href: '/pricing', label: 'Pricing' },
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
