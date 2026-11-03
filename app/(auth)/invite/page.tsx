import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { findOpenInvite } from "@/lib/auth/invites";
import { ROLE_INFO } from "@/lib/auth/permissions";
import { acceptInvite } from "@/app/actions/admin/team";
import { logout } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/fields";
import { Lock } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Admin team invitation", robots: { index: false } };

export default function InvitePage({ searchParams }: PageProps<"/invite">) {
  return (
    <Suspense fallback={<p className="text-muted">Checking your invitation…</p>}>
      <Invite searchParams={searchParams} />
    </Suspense>
  );
}

async function Invite({ searchParams }: Pick<PageProps<"/invite">, "searchParams">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const [invite, user] = await Promise.all([findOpenInvite(token), getCurrentUser()]);

  if (!invite) {
    return (
      <div>
        <h1 className="text-4xl text-ink">This invitation has expired</h1>
        <p className="mt-2 text-muted">The link was already used, replaced by a newer one, or is older than 7 days. Ask the person who invited you to send a new one.</p>
        <Link href="/" className="btn btn-primary mt-8">
          Go to the website
        </Link>
      </div>
    );
  }

  const role = ROLE_INFO[invite.staffRole];
  const back = `/invite?token=${encodeURIComponent(token)}`;

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-ink text-white">
        <Lock size={22} />
      </span>
      <h1 className="mt-5 text-4xl text-ink">Join the admin team</h1>
      <p className="mt-2 text-muted">
        You have been invited to manage the Knowledge Space Academy website as <strong className="text-ink">{role.label}</strong>.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-mist p-5 text-sm">
        <p className="font-semibold text-ink">What this role can do</p>
        <p className="mt-1 text-muted">{role.description}</p>
        <p className="mt-3 text-muted">
          Invitation for <strong className="text-ink">{invite.email}</strong>
        </p>
      </div>

      {!user ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-muted">Log in or create an account with {invite.email} to accept.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/login?next=${encodeURIComponent(back)}`} className="btn btn-primary">
              I have an account: log in
            </Link>
            <Link href={`/register?next=${encodeURIComponent(back)}`} className="btn btn-ghost">
              Create an account
            </Link>
          </div>
        </div>
      ) : user.email.toLowerCase() !== invite.email ? (
        <div className="mt-8 space-y-4">
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            You are logged in as {user.email}, but this invitation is for {invite.email}. Log out, then open the link from your email again.
          </p>
          <form action={logout}>
            <button suppressHydrationWarning type="submit" className="btn btn-dark">
              Log out
            </button>
          </form>
        </div>
      ) : (
        <form action={acceptInvite} className="mt-8">
          <input suppressHydrationWarning type="hidden" name="token" value={token} />
          <SubmitButton pendingText="Joining…">Accept and open the admin</SubmitButton>
        </form>
      )}
    </div>
  );
}
