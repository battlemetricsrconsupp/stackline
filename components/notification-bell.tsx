"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { notifications: NotificationItem[] };
      setNotifications(payload.notifications);
    };

    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  async function openBell() {
    setOpen((current) => !current);

    if (!open && unreadCount > 0) {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void openBell()}
        className="hud-frame relative border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
      >
        <span className="inline-flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alerts
        </span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="panel absolute right-0 top-[calc(100%+0.75rem)] z-40 w-80 rounded-[1.5rem] border border-white/10 p-4 shadow-[0_20px_60px_rgba(4,10,24,0.45)]">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent)]">
            Notifications
          </p>
          <div className="mt-4 space-y-3">
            {notifications.length ? (
              notifications.map((notification) => {
                const content = (
                  <div
                    className={`rounded-2xl border p-3 ${
                      notification.isRead
                        ? "border-white/8 bg-white/4"
                        : "border-[var(--accent)]/25 bg-[var(--accent)]/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{notification.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-soft)]">{notification.body}</p>
                  </div>
                );

                return notification.link ? (
                  <Link key={notification.id} href={notification.link} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-[var(--text-soft)]">
                No alerts yet. We&apos;ll surface invites, acceptances, and queue activity here.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
