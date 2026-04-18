import { AppShell } from "@/components/shell";
import { requireViewer } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/admin";
import { getMatchesForUser } from "@/lib/data";
import { listNotifications, refreshEngagementNotifications } from "@/lib/engagement";
import {
  getLiveQueue,
  getLookingNowState,
  getPendingPlayInvites,
} from "@/lib/live-queue";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireViewer();
  await refreshEngagementNotifications(viewer.id);
  const [matches, lookingNowState, liveQueue, pendingInvites, notifications] = await Promise.all([
    getMatchesForUser(viewer.id),
    getLookingNowState(viewer.id),
    getLiveQueue(viewer.id),
    getPendingPlayInvites(viewer.id),
    listNotifications(viewer.id),
  ]);
  const messageAlerts = matches.filter(
    (match) => match.lastMessage && match.lastMessage.senderId !== viewer.id
  ).length;

  return (
    <AppShell
      username={viewer.username}
      canAccessAdmin={canAccessAdmin({ email: viewer.email, role: viewer.role })}
      messageAlerts={messageAlerts}
      lookingNow={lookingNowState.isLookingNow}
      totalLookingNow={liveQueue.totalLookingNow}
      pendingInvites={pendingInvites}
      notifications={notifications.map((notification) => ({
        ...notification,
        isRead: Boolean(notification.isRead),
      }))}
    >
      {children}
    </AppShell>
  );
}
