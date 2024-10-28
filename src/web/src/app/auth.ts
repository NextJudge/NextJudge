import { getBridgeUrl } from "@/lib/utils";
import { AuthorizeSchema } from "@/lib/zod";
import NextAuth, { User } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { z } from "zod";

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




const AUTH_PROVIDER_PASSWORD: string = process.env.AUTH_PROVIDER_PASSWORD as string

const providers: Provider[] = [
    GitHub,
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
        email: { label: "Email", type: "email" },
        confirmPassword: { label: "Confirm Password", type: "password" },
      },
      authorize: async (credentials, request): Promise<User | null> => {
        // This callback is called on login attempt
        // Registration is handled a separate form - look for signUpUser function in codebase
        try {
          const { email, password } = AuthorizeSchema.parse(credentials);
          const image = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${email}`;

          const response = await fetch(
              `${getBridgeUrl()}/v1/basic_login`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  email: email,
                  password: password,
              }),
          });

          if (!response.ok) {
            return null
          }

          const jsonData: any = await response.json()

          // TODO - check if we need these values
          return {
            // email: user.email,
            // name: user.name,
            image: image,
            nextjudge_token: jsonData["token"],
            nextjudge_id: jsonData["id"]
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
        async jwt({ token, user, trigger }) {

            console.log("JWT")
            console.log(token, user, trigger)

            // This is only true during the initial sign-in
            if(user){
                // Expose the nextjudge_token to the session (used in callback below)
                token.nextjudge_token = user.nextjudge_token
                token.nextjudge_id = user.nextjudge_id
            }

            return token;
        },
        async session({ session, token }) {
            console.log("Session")
            
            // @ts-expect-error
            session.nextjudge_token = token.nextjudge_token
            // @ts-expect-error
            session.nextjudge_id = token.nextjudge_id

            console.log(session)

            // if (session.user && token.sub) {
            //     session.user.id = token.sub;
            // }
            return session;
        },
        async signIn({ user, account, profile }) {
            if (account?.provider === "github") {
                console.log("Reaching out")
                const user_id = `github-${account.providerAccountId}`

                try {
                    const response = await fetch(
                        `${getBridgeUrl()}/v1/create_or_login_user`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": AUTH_PROVIDER_PASSWORD,
                            },
                            body: JSON.stringify({
                                id: user_id,
                                name: user.name,
                                email: user.email
                            }),
                        }
                    )

                    const data = await response.json()

                    user.nextjudge_token = data["token"]
                    user.nextjudge_id = data["id"]
                    return true

                } catch (e){
                    throw e
                }
            } else if (account?.provider === "credentials") {
              // The user is the object returned from authorize callback
              // profile object is the raw body of the HTTP POST submission
              if (user.nextjudge_token) {
                return true
              } else {
                console.log("how did we get here ".repeat(1000))
              }
            }

            return false;
        },
    },
});
