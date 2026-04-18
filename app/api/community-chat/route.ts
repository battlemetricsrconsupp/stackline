import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { getCommunityChatData, postCommunityMessage } from "@/lib/community-chat";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getCommunityChatData();
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { content?: string };
  const message = await postCommunityMessage(viewer.id, String(body.content ?? ""));

  if (!message) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message });
}
