import { AuthorizeSchema } from "@/lib/zod";
import NextAuth, { User } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

// How we extend the User object to include additional fields
declare module "next-auth" {
  interface User {
    email?: string | null | undefined;
    password?: string;
    image?: string | null | undefined;
    name?: string | null | undefined;
    // TODO: figure out how to provide roles
    admin?: boolean;
  }
}

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
        const { email } = AuthorizeSchema.parse(credentials);
        // TODO: Implement "actual" user creation logic here
        const name = email.split("@")[0];
        const image = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${email}`;
        const userWithoutPassword = { email, image, name };
        return userWithoutPassword;
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
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/error",
    newUser: "/auth/signup",
  },
});
