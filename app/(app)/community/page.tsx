import { CommunityChatRoom } from "@/components/community-chat-room";
import { requireViewer } from "@/lib/auth";
import { getCommunityChatData } from "@/lib/community-chat";

export default async function CommunityPage() {
  const viewer = await requireViewer();
  const chat = await getCommunityChatData();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <CommunityChatRoom
        initialMessages={chat.messages}
        initialOnlineCount={chat.onlineCount}
        viewerId={viewer.id}
      />
    </div>
  );
}
