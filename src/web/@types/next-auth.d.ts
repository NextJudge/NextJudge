import 'next-auth';

declare module 'next-auth' {
  interface Session {
    nextjudge_token: string;
    nextjudge_id: string;
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      is_admin?: boolean;
    }
  }

  interface User {
    nextjudge_token: string;
    nextjudge_id: string;
    is_admin?: boolean;
  }

  interface JWT {
    nextjudge_token: string;
    nextjudge_id: string;
    is_admin?: boolean;
  }
}