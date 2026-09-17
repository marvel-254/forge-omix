import React from 'react';
import { cn } from '../../lib/utils';

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  links?: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  sticky?: boolean;
  transparent?: boolean;
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, logo, links, sticky, transparent, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'flex items-center justify-between px-4 py-3',
          sticky && 'sticky top-0 z-50',
          transparent ? 'bg-transparent' : 'bg-background',
          className
        )}
        {...props}
      >
        {logo && <div className="flex items-center">{logo}</div>}
        {links && (
          <ul className="flex space-x-4">
            {links.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    link.active
                      ? 'text-primary' : 'text-foreground hover:text-primary'
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    );
  }
);

Navbar.displayName = 'Navbar';

export { Navbar };
