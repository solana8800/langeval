import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { getServerServiceUrl } from "@/lib/server-api";


// Define backend API URL
const apiUrl = getServerServiceUrl('identity');

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    // Send ID Token to Backend to verify and get Session Token
                    const response = await fetch(`${apiUrl}/auth/google`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            id_token: account.id_token,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Store backend access token in user object temporarily
                        // Note: We'll persist this in JWT callback below
                        user.accessToken = data.access_token;
                        return true;
                    } else {
                        console.error("Backend auth failed", await response.text());
                        return false;
                    }
                } catch (error) {
                    console.error("Auth error", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            // Create initial token
            if (account && user) {
                token.accessToken = user.accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            // Pass backend access token to session
            session.accessToken = token.accessToken;
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
})

export { handler as GET, handler as POST }
