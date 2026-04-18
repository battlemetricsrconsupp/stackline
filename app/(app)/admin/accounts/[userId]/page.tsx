import Link from "next/link";
import { notFound } from "next/navigation";
import { moderateUserAction, updateUserRoleAction } from "@/app/_actions/admin";
import { Tag } from "@/components/tags";
import { canManageRoles, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getEffectiveRole, getStoredRoleForUser } from "@/lib/roles";

function statusBadge(status: string) {
  if (status === "BANNED") {
    return "border-[var(--danger)]/20 bg-[var(--danger)]/10 text-[var(--danger)]";
  }

  if (status === "SUSPENDED") {
    return "border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]";
  }

  return "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]";
}

function roleBadge(role: string) {
  if (role === "OWNER") {
    return "border-amber-400/25 bg-amber-400/12 text-amber-200";
  }

  if (role === "MODERATOR") {
    return "border-sky-400/25 bg-sky-400/12 text-sky-200";
  }

  return "border-white/10 bg-white/5 text-[var(--text-soft)]";
}

export default async function AdminAccountDetailPage(props: {
  params: Promise<{ userId: string }>;
}) {
  const viewer = await requireAdmin();
  const { userId } = await props.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      languages: true,
      playstyles: true,
      playTimes: true,
      gameProfiles: {
        include: {
          game: true,
        },
      },
      reportsMade: {
        include: {
          reportedUser: true,
        },
        orderBy: { createdAt: "desc" },
      },
      reportsReceived: {
        include: {
          reporter: true,
        },
        orderBy: { createdAt: "desc" },
      },
      matchesAsA: {
        include: {
          userA: true,
          userB: true,
          messages: {
            include: {
              sender: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      matchesAsB: {
        include: {
          userA: true,
          userB: true,
          messages: {
            include: {
              sender: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const allMatches = [...user.matchesAsA, ...user.matchesAsB].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
  const storedRole = await getStoredRoleForUser(user.id);
  const effectiveRole = getEffectiveRole({ email: user.email, role: storedRole });
  const viewerCanManageRoles = canManageRoles({
    email: viewer.email,
    role: viewer.role,
  });

  return (
    <div className="space-y-6">
      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]"
            >
              Back to admin
            </Link>
            <h1 className="mt-3 text-4xl font-semibold text-white">{user.username}</h1>
            <p className="mt-2 text-[var(--text-soft)]">{user.email}</p>
          </div>
          <div
            className="flex flex-wrap items-center gap-3"
          >
            <div
              className={`rounded-full border px-4 py-2 text-sm ${roleBadge(effectiveRole)}`}
            >
              {effectiveRole}
            </div>
            <div
              className={`rounded-full border px-4 py-2 text-sm ${statusBadge(
                user.accountStatus
              )}`}
            >
              {user.accountStatus}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Account details
          </p>
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-sm text-[var(--text-soft)]">Age</p>
                <p className="mt-2 text-white">{user.age ?? "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-sm text-[var(--text-soft)]">Region</p>
                <p className="mt-2 text-white">{user.region ?? "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-sm text-[var(--text-soft)]">Timezone</p>
                <p className="mt-2 text-white">{user.timezone ?? "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-sm text-[var(--text-soft)]">Online status</p>
                <p className="mt-2 text-white">{user.onlineStatus}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Bio</p>
              <p className="mt-2 leading-7 text-white">{user.bio || "No bio set."}</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Languages</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.languages.length ? (
                  user.languages.map((item: (typeof user.languages)[number]) => (
                    <Tag key={item.id}>{item.language}</Tag>
                  ))
                ) : (
                  <span className="text-sm text-[var(--text-soft)]">None set</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Playstyle</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.playstyles.length ? (
                  user.playstyles.map((item: (typeof user.playstyles)[number]) => (
                    <Tag key={item.id}>{item.tag}</Tag>
                  ))
                ) : (
                  <span className="text-sm text-[var(--text-soft)]">None set</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Play times</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.playTimes.length ? (
                  user.playTimes.map((item: (typeof user.playTimes)[number]) => (
                    <Tag key={item.id}>{item.label}</Tag>
                  ))
                ) : (
                  <span className="text-sm text-[var(--text-soft)]">None set</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Games and ranks</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.gameProfiles.length ? (
                  user.gameProfiles.map((item: (typeof user.gameProfiles)[number]) => (
                    <Tag key={item.id}>
                      {item.game.name} - {item.rankLabel}
                    </Tag>
                  ))
                ) : (
                  <span className="text-sm text-[var(--text-soft)]">No games added</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Moderation controls
          </p>
          {viewerCanManageRoles ? (
            <form action={updateUserRoleAction} className="mt-5 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="userId" value={user.id} />
              <button
                name="role"
                value="MODERATOR"
                className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-200"
              >
                Make moderator
              </button>
              <button
                name="role"
                value="USER"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                Remove staff role
              </button>
            </form>
          ) : null}
          <form action={moderateUserAction} className="mt-5 space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            <textarea
              name="moderationNote"
              defaultValue={user.moderationNote ?? ""}
              placeholder="Add moderator notes here"
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-[#0d172b] px-4 py-3 text-sm"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <button
                name="status"
                value="SUSPENDED"
                className="rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]"
              >
                Suspend account
              </button>
              <button
                name="status"
                value="BANNED"
                className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
              >
                Ban account
              </button>
              <button
                name="status"
                value="ACTIVE"
                className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]"
              >
                Reactivate account
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Reports received</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {user.reportsReceived.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Reports made</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {user.reportsMade.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-[var(--text-soft)]">Current note</p>
              <p className="mt-2 text-white">
                {user.moderationNote || "No moderator note saved."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Reports on this account
          </p>
          <div className="mt-5 space-y-4">
            {user.reportsReceived.length ? (
              user.reportsReceived.map((report: (typeof user.reportsReceived)[number]) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-white/8 bg-white/4 p-4"
                >
                  <p className="text-sm text-white">
                    <Link
                      href={`/admin/accounts/${report.reporter.id}`}
                      className="underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                    >
                      {report.reporter.username}
                    </Link>
                    :{" "}
                    <span className="text-[var(--warning)]">{report.reason}</span>
                  </p>
                  {report.details ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                      {report.details}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-soft)]">No reports on this user.</p>
            )}
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            All chats for this account
          </p>
          <div className="mt-5 space-y-4">
            {allMatches.length ? (
              allMatches.map((match: (typeof allMatches)[number]) => {
                const otherUser =
                  match.userAId === user.id ? match.userB.username : match.userA.username;

                return (
                  <div
                    key={match.id}
                    className="rounded-3xl border border-white/8 bg-white/4 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-white">
                        Conversation with{" "}
                        <Link
                          href={`/admin/accounts/${match.userAId === user.id ? match.userBId : match.userAId}`}
                          className="underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                        >
                          {otherUser}
                        </Link>
                      </p>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-[var(--text-soft)]">
                        {match.messages.length} messages
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {match.messages.length ? (
                        match.messages.map((message: (typeof match.messages)[number]) => (
                        <div
                          key={message.id}
                          className="rounded-2xl border border-white/8 bg-[#0d172b] px-4 py-3"
                        >
                          <p className="text-sm font-medium text-white">
                              <Link
                                href={`/admin/accounts/${message.sender.id}`}
                                className="underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                              >
                                {message.sender.username}
                              </Link>
                          </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                              {message.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[var(--text-soft)]">
                          No messages in this chat yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[var(--text-soft)]">
                This account has no chats yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
