import { apiGetNotificationsCount, apiGetUserNotifications } from "@/lib/api";
import { Session } from "next-auth";
import { NotificationBell } from "./notification-bell";

export async function NotificationBellServer({ session }: { session: Session | undefined }) {
    if (!session?.nextjudge_token) {
        return null;
    }

    try {
        const [countData, notificationsData] = await Promise.all([
            apiGetNotificationsCount(session.nextjudge_token),
            apiGetUserNotifications(session.nextjudge_token)
        ]);

        const notificationCount = countData?.count || 0;
        const notifications = notificationsData || [];

        return (
            <NotificationBell
                session={session}
                notificationCount={notificationCount}
                notifications={notifications}
            />
        );
    } catch (error) {
        console.error("Error fetching notification data:", error);
        return (
            <NotificationBell
                session={session}
                notificationCount={0}
                notifications={[]}
            />
        );
    }
}
