"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, Compass, History, Bookmark, List, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userEmail?: string | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

const memberNavLinks = [
  { href: "/history", label: "History", icon: History },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/watchlist", label: "Watchlist", icon: List },
];

export function Header({ userEmail, onSignIn, onSignOut }: HeaderProps) {
  const pathname = usePathname();
  const isLoggedIn = !!userEmail;
  const recommendActive = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-(--glass-border) bg-(--deep-sea)/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 min-h-[44px] min-w-[44px]"
          aria-label="theOneRec home"
        >
          <Anchor className="h-6 w-6 text-treasure-gold" aria-hidden="true" />
          <span className="text-lg font-bold text-treasure-gold">
            theOneRec
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 sm:gap-2 ml-auto"
        >
          {isLoggedIn &&
            memberNavLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "hidden md:flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium min-h-[44px] transition-colors",
                    active
                      ? "bg-(--glass) text-treasure-gold"
                      : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--glass)",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}

          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium min-h-[44px] transition-colors",
              recommendActive
                ? "bg-(--glass) text-treasure-gold"
                : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--glass)",
            )}
            aria-current={recommendActive ? "page" : undefined}
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Recommend</span>
          </Link>

          {isLoggedIn ? (
            <>
              <span className="hidden lg:inline text-sm text-(--text-secondary) truncate max-w-[160px]">
                {userEmail}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onSignOut}
                aria-label="Sign out"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              variant="gold"
              size="sm"
              onClick={onSignIn}
              aria-label="Join the Crew — sign in"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Join the Crew
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
