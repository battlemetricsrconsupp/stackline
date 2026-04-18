import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { listNotifications, markNotificationsRead } from "@/lib/engagement";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await listNotifications(viewer.id);
  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      ...notification,
      isRead: Boolean(notification.isRead),
    })),
  });
}

export async function POST() {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markNotificationsRead(viewer.id);
  return NextResponse.json({ ok: true });
}
