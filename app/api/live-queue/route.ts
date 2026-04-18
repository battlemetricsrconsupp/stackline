import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import {
  getLiveQueue,
  getLookingNowState,
  getOutgoingPendingInviteIds,
  toggleLookingNow,
} from "@/lib/live-queue";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [queue, state, outgoingPendingInviteIds] = await Promise.all([
    getLiveQueue(viewer.id),
    getLookingNowState(viewer.id),
    getOutgoingPendingInviteIds(viewer.id),
  ]);

  return NextResponse.json({
    ...queue,
    viewerLookingNow: state.isLookingNow,
    lookingNowStartedAt: state.lookingNowStartedAt,
    outgoingPendingInviteIds: Array.from(outgoingPendingInviteIds),
  });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { enabled?: boolean };
  await toggleLookingNow(viewer.id, Boolean(body.enabled));

  const state = await getLookingNowState(viewer.id);
  return NextResponse.json(state);
}
