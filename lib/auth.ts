import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export const authConfig: NextAuthConfig = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectToDatabase();
          const user = await User.findOne({ email: (credentials.email as string).toLowerCase() }).select("+passwordHash");

          if (!user || !user.passwordHash) {
            return null;
          }

          const isMatch = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!isMatch) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatar || "",
            username: user.username,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          let dbUser = await User.findOne({ email: user.email?.toLowerCase() });
          if (!dbUser) {
            const baseName = user.name || "Focus User";
            const username =
              baseName.toLowerCase().replace(/[^a-z0-9]/g, "") +
              Math.floor(1000 + Math.random() * 9000);
            dbUser = await User.create({
              name: baseName,
              email: user.email?.toLowerCase(),
              username,
              avatar: user.image || "",
            });
          }
          user.id = dbUser._id.toString();
          (user as any).username = dbUser.username;
          user.image = dbUser.avatar || user.image;
          return true;
        } catch (e) {
          console.error("Google signIn error:", e);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.picture = user.image;
        token.image = user.image;
      }

      // Guarantee token.id is a valid MongoDB ObjectId
      if ((!token.id || !mongoose.Types.ObjectId.isValid(token.id as string)) && token.email) {
        try {
          await connectToDatabase();
          let dbUser = await User.findOne({ email: (token.email as string).toLowerCase() });
          if (!dbUser) {
            const baseName = (token.name as string) || "Focus User";
            const username =
              baseName.toLowerCase().replace(/[^a-z0-9]/g, "") +
              Math.floor(1000 + Math.random() * 9000);
            dbUser = await User.create({
              name: baseName,
              email: (token.email as string).toLowerCase(),
              username,
              avatar: (token.picture as string) || (token.image as string) || "",
            });
          }
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.sub = dbUser._id.toString();
            token.username = dbUser.username;
            token.picture = dbUser.avatar || token.picture;
            token.image = dbUser.avatar || token.image;
          }
        } catch (e) {
          console.error("JWT sync error:", e);
        }
      }

      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.picture = session.image || token.picture;
        token.image = session.image || token.image;
        token.username = session.username || token.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id || token.sub) as string;
        (session.user as any).username = token.username;
        session.user.image = (token.picture || token.image) as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
