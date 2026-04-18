import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import {
  getPendingPlayInvites,
  respondToPlayInvite,
  sendPlayInvite,
} from "@/lib/live-queue";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await getPendingPlayInvites(viewer.id);
  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as
    | {
        action: "send";
        receiverId: string;
        gameSlug?: string | null;
      }
    | {
        action: "respond";
        inviteId: string;
        accept: boolean;
      };

  if (body.action === "send") {
    if (body.receiverId === viewer.id) {
      return NextResponse.json({ error: "Invalid receiver" }, { status: 400 });
    }

    await sendPlayInvite({
      senderId: viewer.id,
      receiverId: body.receiverId,
      gameSlug: body.gameSlug ?? null,
    });

    return NextResponse.json({ ok: true });
  }

  const result = await respondToPlayInvite({
    inviteId: body.inviteId,
    receiverId: viewer.id,
    accept: Boolean(body.accept),
  });

  if (!result) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
