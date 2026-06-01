import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

const providers = [];

const cleanEnv = (value: string | undefined) => value?.trim();

const googleClientId = cleanEnv(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID);
const googleClientSecret =
  cleanEnv(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET);

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      token: {
        url: "https://oauth2.googleapis.com/token",
      },
      userinfo: {
        url: "https://openidconnect.googleapis.com/v1/userinfo",
      },
    })
  );
}

const githubClientId = cleanEnv(process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID);
const githubClientSecret =
  cleanEnv(process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET);

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
}

const authConfig = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      if (account && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existing) {
          const trialEnd = new Date();
          trialEnd.setHours(trialEnd.getHours() + 24);
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: "pro",
              trialEndsAt: trialEnd,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      if (account && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, trialEndsAt: true },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.trialEndsAt = dbUser.trialEndsAt?.toISOString() || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub as string;
        (session.user as unknown as Record<string, unknown>).role = token.role;
        (session.user as unknown as Record<string, unknown>).trialEndsAt = token.trialEndsAt;
      }
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = authConfig;
