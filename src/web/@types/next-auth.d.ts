import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    nextjudge_token: string;
    nextjudge_id: string
  }

  interface User {
    nextjudge_token: string;
    nextjudge_id: string
  }

  interface JWT {
    nextjudge_token: string;
    nextjudge_id: string
  }
}