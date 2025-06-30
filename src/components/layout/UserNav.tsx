"use client";
import type { UserSession } from "@/lib/auth.config";
import { encodeId } from "@/lib/hashids";
import { LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUser } from "@/app/actions";

/**
 * Props for the UserNav component.
 */
interface UserNavProps {
  /** The authenticated user's session data, or null/undefined if not logged in. */
  user?: UserSession | null;
}

/**
 * UserNav component provides a dropdown menu for user-related actions
 * like viewing profile or logging out. It displays the user's avatar.
 * @param props - The props for the component.
 * @returns The UserNav React element.
 */
export function UserNav({ user }: UserNavProps) {
  const router = useRouter(); // Added
  const userName =
    user?.username ||
    (user?.role === "student" ? "Student Guest" : "Instructor Guest");
  const userAvatarUrl = user?.avatarUrl ?? "https://placehold.co/40x40.png";

  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || (user?.role ? user.role.charAt(0).toUpperCase() : "G");

  const profileLink =
    user?.id && user?.role ? `/${user.role}/${encodeId(user.id)}/profile` : "#";

  /**
   * Handles the user logout process.
   * Calls the logoutUser server action and then redirects to the homepage.
   */
  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={userAvatarUrl}
              alt={userName}
              data-ai-hint={
                !user?.avatarUrl ? "placeholder avatar" : "profile avatar"
              }
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild disabled={profileLink === "#"}>
                <Link href={profileLink}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Guest</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Not logged in
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login/student">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Login as Student</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/login/instructor">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Login as Instructor</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
