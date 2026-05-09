import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

const providers = [];

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

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

const githubClientId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID;
const githubClientSecret =
  process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;

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
});

export const { handlers, auth, signIn, signOut } = authConfig;
