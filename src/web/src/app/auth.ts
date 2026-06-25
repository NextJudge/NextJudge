import { getBridgeUrl } from "@/lib/utils";
import { LoginFormSchema } from "@/lib/zod";
import NextAuth, { User } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

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


const webBridgeSecret =
    process.env.WEB_BRIDGE_SECRET ?? process.env.AUTH_PROVIDER_PASSWORD ?? "";

interface NextJudgeUserResponse {
    email: string;
    name: string;
    image: string;
    is_admin: boolean;
}

interface BasicLoginResponse {
    email?: string;
    name?: string;
    image?: string;
    token: string;
    id: string;
}

const clearNextJudgeSession = (token: Record<string, unknown>) => {
    delete token.nextjudge_token
    delete token.nextjudge_id
    delete token.nextjudge_email
    delete token.nextjudge_name
    delete token.nextjudge_image
    delete token.nextjudge_is_admin
}

const fetchNextJudgeUser = async (
    userId: string,
    authToken: string,
): Promise<NextJudgeUserResponse | null | undefined> => {
    try {
        const response = await fetch(
            `${getBridgeUrl()}/v1/users/${userId}`, {
            headers: {
                Authorization: authToken,
            },
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            return undefined;
        }

        return await response.json() as NextJudgeUserResponse;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        return undefined;
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
                const { email, password } = LoginFormSchema.parse(credentials);
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

                const jsonData = await response.json() as BasicLoginResponse

                return {
                    email: jsonData.email || email,
                    name: jsonData.name || email.split("@")[0],
                    image: jsonData.image || image,
                    nextjudge_token: jsonData.token,
                    nextjudge_id: jsonData.id
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
    debug: process.env.NODE_ENV === "development" ? true : false,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.nextjudge_token = user.nextjudge_token
                token.nextjudge_id = user.nextjudge_id
            }

            if (typeof token.nextjudge_token === "string" && typeof token.nextjudge_id === "string") {
                const userData = await fetchNextJudgeUser(
                    token.nextjudge_id,
                    token.nextjudge_token,
                );

                if (userData === null) {
                    clearNextJudgeSession(token);
                    return token;
                }

                if (userData) {
                    token.nextjudge_email = userData.email;
                    token.nextjudge_name = userData.name;
                    token.nextjudge_image = userData.image;
                    token.nextjudge_is_admin = userData.is_admin;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (typeof token.nextjudge_token === "string" && typeof token.nextjudge_id === "string") {
                session.nextjudge_token = token.nextjudge_token
                session.nextjudge_id = token.nextjudge_id

                if (session.user) {
                    if (typeof token.nextjudge_email === "string") {
                        session.user.email = token.nextjudge_email;
                    }
                    if (typeof token.nextjudge_name === "string") {
                        session.user.name = token.nextjudge_name;
                    }
                    if (typeof token.nextjudge_image === "string") {
                        session.user.image = token.nextjudge_image;
                    }
                    if (typeof token.nextjudge_is_admin === "boolean") {
                        session.user.is_admin = token.nextjudge_is_admin;
                    }
                }
            }

            return session;
        },
        async signIn({ user, account, profile }) {
            if (account?.provider === "github") {
                console.log("Reaching out")
                const user_id = `github-${account.providerAccountId}`
                const githubProfile = profile
                const image = user.image || githubProfile?.avatar_url || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user.email}`

                try {
                    const response = await fetch(
                        `${getBridgeUrl()}/v1/create_or_login_user`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": webBridgeSecret,
                        },
                        body: JSON.stringify({
                            id: user_id,
                            name: user.name,
                            email: user.email,
                            image: image
                        }),
                    }
                    )

                    if (!response.ok) {
                        console.error("Backend auth failed:", response.status, response.statusText)
                        const errorText = await response.text()
                        console.error("Error response:", errorText)
                        return false
                    }

                    const contentType = response.headers.get("content-type")
                    if (!contentType || !contentType.includes("application/json")) {
                        console.error("Backend returned non-JSON response:", contentType)
                        const responseText = await response.text()
                        console.error("Response body:", responseText)
                        return false
                    }

                    const data = await response.json()

                    if (!data.token || !data.id) {
                        console.error("Backend response missing token or id:", data)
                        return false
                    }

                    user.nextjudge_token = data["token"]
                    user.nextjudge_id = data["id"]
                    return true

                } catch (e) {
                    console.error("Auth error:", e)
                    return false
                }
            } else if (account?.provider === "credentials") {
                if (user && user.nextjudge_token) {
                    return true
                } else {
                    console.log("Credentials auth failed - no user or nextjudge_token")
                    return false
                }
            }

            return false;
        },
    },
});
