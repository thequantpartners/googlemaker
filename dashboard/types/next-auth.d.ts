import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    backendToken?: string;
    user: {
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    backendToken?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    role?: string;
  }
}
