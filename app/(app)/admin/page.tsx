import Link from "next/link";
import {
  addGameAction,
  moderateUserAction,
  updateUserRoleAction,
} from "@/app/_actions/admin";
import { canManageRoles, requireAdmin } from "@/lib/admin";
import { getCatalogData, getDashboardStats } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { getEffectiveRole, getStoredRolesForUsers } from "@/lib/roles";

type AccountStatusFilter = "ACTIVE" | "SUSPENDED" | "BANNED";

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

export default async function AdminPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await requireAdmin();
  const viewerCanManageRoles = canManageRoles({
    email: viewer.email,
    role: viewer.role,
  });

  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const rawStatus =
    typeof searchParams.status === "string" ? searchParams.status.trim() : "";
  const status: AccountStatusFilter | "" =
    rawStatus === "ACTIVE" || rawStatus === "SUSPENDED" || rawStatus === "BANNED"
      ? rawStatus
      : "";

  const userWhere = {
    ...(query
      ? {
          OR: [
            {
              username: {
                contains: query,
              },
            },
            {
              email: {
                contains: query.toLowerCase(),
              },
            },
          ],
        }
      : {}),
    ...(status ? { accountStatus: status } : {}),
  };

  const [stats, games, reports, users, allMatches] = await Promise.all([
    getDashboardStats(),
    getCatalogData(),
    prisma.report.findMany({
      include: {
        reporter: true,
        reportedUser: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.user.findMany({
      where: userWhere,
      include: {
        reportsReceived: {
          include: {
            reporter: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ accountStatus: "desc" }, { createdAt: "desc" }],
    }),
    prisma.match.findMany({
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
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const roleMap = await getStoredRolesForUsers(
    users.map((user: (typeof users)[number]) => user.id)
  );

  const reportedAccounts = users.filter(
    (account: (typeof users)[number]) => account.reportsReceived.length > 0
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Users", value: stats.users },
          { label: "Games", value: stats.games },
          { label: "Matches", value: stats.matches },
          { label: "Open reports", value: stats.reports },
        ].map((item: { label: string; value: number }) => (
          <div key={item.label} className="panel rounded-[2rem] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--text-soft)]">
              {item.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_1fr]">
        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Game catalog
          </p>
          <form action={addGameAction} className="mt-5 space-y-4">
            <input
              name="name"
              placeholder="Game name"
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
            <input
              name="slug"
              placeholder="game-slug"
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
            <input
              name="genre"
              placeholder="Genre"
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
            />
            <button className="rounded-2xl bg-white px-5 py-3 font-medium text-slate-950">
              Add or update game
            </button>
          </form>

          <div className="mt-6 grid gap-3">
            {games.map((game: (typeof games)[number]) => (
              <div
                key={game.id}
                className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white"
              >
                {game.name}
                <span className="ml-2 text-[var(--text-soft)]">- {game.genre}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Recent reports
          </p>
          <div className="mt-5 space-y-4">
            {reports.length ? (
              reports.map((report: (typeof reports)[number]) => (
                <div
                  key={report.id}
                  className="rounded-3xl border border-white/8 bg-white/4 p-4"
                >
                  <p className="font-medium text-white">
                    <Link
                      href={`/admin/accounts/${report.reporter.id}`}
                      className="underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                    >
                      {report.reporter.username}
                    </Link>{" "}
                    reported{" "}
                    <Link
                      href={`/admin/accounts/${report.reportedUser.id}`}
                      className="underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                    >
                      {report.reportedUser.username}
                    </Link>
                  </p>
                  <p className="mt-2 text-sm text-[var(--warning)]">{report.reason}</p>
                  {report.details ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                      {report.details}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-soft)]">No reports yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
              Account moderation
            </p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Search by username or email, or filter by account status.
            </p>
          </div>
          <form className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search username or email"
              className="rounded-2xl border border-white/10 bg-[#0d172b] px-4 py-3 text-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-white/10 bg-[#0d172b] px-4 py-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-950">
              Search
            </button>
          </form>
        </div>

        <div className="mt-5 space-y-4">
          {users.length ? (
            users.map((user: (typeof users)[number]) => {
              const effectiveRole = getEffectiveRole({
                email: user.email,
                role: roleMap.get(user.id),
              });

              return (
                <div
                  key={user.id}
                  className="rounded-3xl border border-white/8 bg-white/4 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/admin/accounts/${user.id}`}
                        className="font-medium text-white underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                      >
                        {user.username}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full border px-3 py-1 text-sm ${roleBadge(
                          effectiveRole
                        )}`}
                      >
                        {effectiveRole}
                      </div>
                      <Link
                        href={`/admin/accounts/${user.id}`}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-[var(--accent)]/30"
                      >
                        Open account
                      </Link>
                      <div
                        className={`rounded-full border px-3 py-1 text-sm ${statusBadge(
                          user.accountStatus
                        )}`}
                      >
                        {user.accountStatus}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--text-soft)]">
                    <span>{user.reportsReceived.length} reports</span>
                    {user.moderationNote ? (
                      <span>Moderator note: {user.moderationNote}</span>
                    ) : null}
                  </div>

                  {viewerCanManageRoles ? (
                    <form
                      action={updateUserRoleAction}
                      className="mt-4 grid gap-3 lg:grid-cols-[1fr_160px_160px]"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <div className="rounded-2xl border border-white/8 bg-[#0d172b] px-4 py-3 text-sm text-[var(--text-soft)]">
                        Role access for admin tools
                      </div>
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

                  <form
                    action={moderateUserAction}
                    className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_140px_140px]"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      name="moderationNote"
                      defaultValue={user.moderationNote ?? ""}
                      placeholder="Why is this account being moderated?"
                      className="rounded-2xl border border-white/10 bg-[#0d172b] px-4 py-3 text-sm"
                    />
                    <button
                      name="status"
                      value="SUSPENDED"
                      className="rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]"
                    >
                      Suspend
                    </button>
                    <button
                      name="status"
                      value="BANNED"
                      className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
                    >
                      Ban
                    </button>
                    <button
                      name="status"
                      value="ACTIVE"
                      className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]"
                    >
                      Reactivate
                    </button>
                  </form>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-white/8 bg-white/4 p-6 text-sm text-[var(--text-soft)]">
              No accounts matched that search.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Reported accounts
          </p>
          <div className="mt-5 space-y-4">
            {reportedAccounts.length ? (
              reportedAccounts.map((account: (typeof reportedAccounts)[number]) => (
                <div
                  key={account.id}
                  className="rounded-3xl border border-white/8 bg-white/4 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{account.username}</p>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">
                        {account.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/accounts/${account.id}`}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-[var(--accent)]/30"
                      >
                        Open account
                      </Link>
                      <div className="rounded-full border border-[var(--warning)]/20 bg-[var(--warning)]/10 px-3 py-1 text-sm text-[var(--warning)]">
                        {account.reportsReceived.length} reports
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {account.reportsReceived.slice(0, 3).map(
                      (report: (typeof account.reportsReceived)[number]) => (
                      <div
                        key={report.id}
                        className="rounded-2xl border border-white/8 bg-[#0d172b] px-4 py-3"
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
                          <p className="mt-1 text-sm text-[var(--text-soft)]">
                            {report.details}
                          </p>
                        ) : null}
                      </div>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-soft)]">No reported accounts yet.</p>
            )}
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            All chats
          </p>
          <div className="mt-5 space-y-4">
            {allMatches.length ? (
              allMatches.map((match: (typeof allMatches)[number]) => (
                <div
                  key={match.id}
                  className="rounded-3xl border border-white/8 bg-white/4 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">
                      <Link
                        href={`/admin/accounts/${match.userA.id}`}
                        className="underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                      >
                        {match.userA.username}
                      </Link>{" "}
                      and{" "}
                      <Link
                        href={`/admin/accounts/${match.userB.id}`}
                        className="underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
                      >
                        {match.userB.username}
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
                        No messages in this match yet.
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-soft)]">No chats yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
