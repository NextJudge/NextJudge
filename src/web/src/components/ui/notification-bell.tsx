"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/queries/use-notifications";
import { Notification } from "@/lib/types";
import { format } from "date-fns";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Session } from "next-auth";
import { useState } from "react";

export function NotificationBell({ session }: { session: Session }) {
  const token = session.nextjudge_token;
  const [isOpen, setIsOpen] = useState(false);

  const {
    count,
    notifications,
    isLoading,
    refetch,
    markAllRead,
    isMarkingRead,
  } = useNotifications(token);

  const renderNotification = (notification: Notification) => {
    const href = `/platform/contests/${notification.event_id}`;

    return (
      <Link
        key={notification.id}
        href={href}
        className="block p-3 border rounded-md hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={notification.question?.user?.image} />
              <AvatarFallback className="text-xs">
                {notification.question?.user?.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            {notification.notification_type === "answer" &&
              notification.question?.answerer && (
                <>
                  <div className="w-px h-2 bg-border" />
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={notification.question.answerer.image} />
                    <AvatarFallback className="text-xs">
                      {notification.question.answerer.name?.[0]?.toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                </>
              )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium">
                {notification.notification_type === "question"
                  ? "New Question"
                  : "Question Answered"}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(notification.created_at), "MMM d, h:mm a")}
              </div>
            </div>
            {notification.question && (
              <>
                <div className="text-sm mb-2">
                  <strong>Q:</strong> {notification.question.question}
                </div>
                {notification.notification_type === "answer" &&
                  notification.question.answer && (
                    <div className="text-sm mb-2">
                      <strong>A:</strong> {notification.question.answer}
                    </div>
                  )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>
                    Asked by:{" "}
                    {notification.question.user?.name || "Anonymous"}
                  </span>
                  {notification.question.answerer && (
                    <span>
                      • Answered by: {notification.question.answerer.name}
                    </span>
                  )}
                  {notification.question.problem && (
                    <span>
                      • Problem: {notification.question.problem.title}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      void refetch();
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await markAllRead();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  if (!token) {
    return null;
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Notifications</CardTitle>
              {count > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleMarkAsRead()}
                  disabled={isMarkingRead}
                  className="text-xs"
                >
                  Mark as Read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent notifications
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {unreadNotifications.length > 0 && (
                  <div className="p-4 pb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium">Unread</h3>
                      <Badge
                        variant="destructive"
                        className="text-xs px-1.5 py-0.5"
                      >
                        {unreadNotifications.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {unreadNotifications.map(renderNotification)}
                    </div>
                  </div>
                )}

                {unreadNotifications.length > 0 &&
                  readNotifications.length > 0 && (
                    <div className="px-4 py-3">
                      <Separator />
                    </div>
                  )}

                {readNotifications.length > 0 && (
                  <div className="p-4 pt-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Recent
                      </h3>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        {readNotifications.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {readNotifications.map(renderNotification)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
