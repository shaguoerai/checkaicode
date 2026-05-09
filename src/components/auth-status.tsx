"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type Session = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export function AuthStatus({ signInLabel = "Sign In" }: { signInLabel?: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setSession(data);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loaded && session?.user) {
    const displayName = session.user.name || session.user.email || "Account";

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 items-center gap-2 rounded-md border border-neon/25 bg-neon/10 px-3 py-2 text-sm font-medium text-white transition hover:border-neon/50 hover:bg-neon/15"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {session.user.image && !imageFailed ? (
            <img
              src={session.user.image}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neon/20 text-xs font-semibold text-neon">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="max-w-36 truncate">{displayName}</span>
          <svg
            className={`h-4 w-4 text-white/50 transition ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-white/10 bg-[#0b0b0b] p-3 text-sm text-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              {session.user.image && !imageFailed ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon/20 text-sm font-semibold text-neon">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate font-medium">{displayName}</div>
                {session.user.email ? (
                  <div className="truncate text-xs text-white/50">{session.user.email}</div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 w-full rounded-md px-3 py-2 text-left text-white/70 transition hover:bg-white/10 hover:text-white"
              role="menuitem"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href="/auth/signin"
      className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#050505] transition hover:bg-white/90"
    >
      {signInLabel}
    </Link>
  );
}
