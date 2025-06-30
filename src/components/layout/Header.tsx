
import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { UserNav } from '@/components/layout/UserNav';
import { encodeId } from '@/lib/hashids';
import type { UserSession } from '@/lib/auth.config';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

interface HeaderProps {
  loggedInUser?: UserSession | null;
}

/**
 * Header component for the application.
 * Displays the logo, navigation links, and user-specific controls like theme toggle and user menu.
 * @param {HeaderProps} props - The props for the Header component.
 * @returns {JSX.Element} The Header React element.
 */
export function Header({ loggedInUser }: HeaderProps): JSX.Element {
  
  const userTypeForLink = loggedInUser?.role || 'student';
  const userIdForLink = loggedInUser?.id;

  const dashboardLink = userIdForLink 
    ? `/${userTypeForLink}/${encodeId(userIdForLink)}/dashboard` 
    : '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href={dashboardLink} passHref>
          <Logo />
        </Link>
        <div className="flex items-center space-x-2 md:space-x-4">
          <ThemeToggleButton />
          <UserNav user={loggedInUser} />
        </div>
      </div>
    </header>
  );
}
