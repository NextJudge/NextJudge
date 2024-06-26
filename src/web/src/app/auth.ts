import { AuthorizeSchema } from "@/lib/zod";
import { PrismaClient } from "@prisma/client";
import NextAuth, { User } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

export const prisma = new PrismaClient();

// How we extend the User object to include additional fields
// declare module "next-auth" {
//   interface User {
//     id?: string | undefined;
//     email?: string | null | undefined;
//     password?: string;
//     image?: string | null | undefined;
//     name?: string | null | undefined;
//     // TODO: figure out how to provide roles
//     admin?: boolean;
//   }
// }

const providers: Provider[] = [
  GitHub,
  Credentials({
    credentials: {
      password: { label: "Password", type: "password" },
      email: { label: "Email", type: "email" },
      confirmPassword: { label: "Confirm Password", type: "password" },
    },
    authorize: async (credentials, request): Promise<User | null> => {
      try {
        const { email, password } = AuthorizeSchema.parse(credentials);
        const image = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${email}`;
        const user = await prisma.users.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        // TODO: Secure this
        if (user.password_hash !== password) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: image,
        };
      } catch (error) {
        return null;
      }
    },
  }),
];

export const providerMap = providers.map((provider) => {
  if (typeof provider === "function") {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  } else {
    return { id: provider.id, name: provider.name };
  }
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/error",
    newUser: "/platform",
  },
  debug: true,
  callbacks: {
    async session({ session, user, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        const existsUser = await prisma.users.findFirst({
          where: {
            email: profile?.email ?? "",
          },
        });

        if (!existsUser) {
          await prisma.users.create({
            data: {
              id: parseInt(profile?.id as string),
              email: user.email as string,
              name: user.name as string,
              image: user.image as string,
              join_date: new Date(),
            },
          });
        }
      }
      return true;
    },
  },
});
