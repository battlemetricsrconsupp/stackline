import Link from "next/link";
import { Flame, MessageCircleMore, Search, Settings, Shield, Sparkles, Users, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { logoutAction } from "@/app/_actions/auth";
import { LiveQueueToggle } from "@/components/live-queue-toggle";
import { IncomingInviteToast } from "@/components/incoming-invite-toast";
import { NotificationBell } from "@/components/notification-bell";

type ShellProps = {
  username: string;
  canAccessAdmin: boolean;
  messageAlerts: number;
  lookingNow: boolean;
  totalLookingNow: number;
  pendingInvites: Array<{
    id: string;
    senderUsername: string;
    senderRegion: string | null;
    senderOnlineStatus: string | null;
    gameSlug: string | null;
    createdAt: Date;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }>;
  children: React.ReactNode;
};

const navItems = [
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/live", label: "Live Queue", icon: Flame },
  { href: "/community", label: "Community", icon: Users },
  { href: "/search", label: "Search", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageCircleMore },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
] as const;

export function AppShell({
  username,
  canAccessAdmin,
  messageAlerts,
  lookingNow,
  totalLookingNow,
  pendingInvites,
  notifications,
  children,
}: ShellProps) {
  const visibleNavItems = canAccessAdmin
    ? navItems
    : navItems.filter((item) => item.href !== "/admin");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="panel sticky top-4 z-20 mb-6 rounded-[1.5rem] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Logo href="/discover" />
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-[var(--text-soft)] lg:hidden">
              {username}
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {visibleNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-white/8 bg-white/4 px-4 py-2 text-sm text-[var(--text-soft)] transition hover:border-white/14 hover:bg-white/7 hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                  {href === "/messages" && messageAlerts > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
                      {messageAlerts}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </nav>
          <div className="lg:hidden">
            <div className="flex items-center gap-2">
              <NotificationBell
                initialNotifications={notifications.map((notification) => ({
                  ...notification,
                  createdAt: notification.createdAt.toISOString(),
                }))}
              />
              <LiveQueueToggle
                initialLookingNow={lookingNow}
                initialTotalLookingNow={totalLookingNow}
              />
            </div>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <NotificationBell
              initialNotifications={notifications.map((notification) => ({
                ...notification,
                createdAt: notification.createdAt.toISOString(),
              }))}
            />
            <LiveQueueToggle
              initialLookingNow={lookingNow}
              initialTotalLookingNow={totalLookingNow}
            />
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-[var(--text-soft)]">
              @{username}
            </div>
            <form action={logoutAction}>
              <button className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent)] px-4 py-2 text-sm font-medium text-slate-950 transition hover:opacity-90">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <IncomingInviteToast
        initialInvites={pendingInvites.map((invite) => ({
          ...invite,
          createdAt: invite.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
