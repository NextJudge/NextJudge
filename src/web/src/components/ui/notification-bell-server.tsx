import { NotificationBell } from "./notification-bell";
import { Session } from "next-auth";

export function NotificationBellServer({
  session,
}: {
  session: Session | undefined;
}) {
  if (!session?.nextjudge_token) {
    return null;
  }

  return <NotificationBell session={session} />;
}
