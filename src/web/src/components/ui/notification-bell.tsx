"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { apiMarkNotificationsAsRead } from "@/lib/api"
import { Notification } from "@/lib/types"
import { format } from "date-fns"
import { Bell } from "lucide-react"
import { useState } from "react"

export function NotificationBell({
    session,
    notificationCount,
    notifications
}: {
    session: any;
    notificationCount: number;
    notifications: Notification[]
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications)
    const [localNotificationCount, setLocalNotificationCount] = useState<number>(notificationCount)

    const fetchNotifications = async () => {
        if (!session?.nextjudge_token) return

        setIsLoading(true)
        try {
            // For now, we'll just use the passed notifications
            // In the future, we could add a refresh endpoint
            setIsLoading(false)
        } catch (error) {
            console.error("Error fetching notifications:", error)
            setIsLoading(false)
        }
    }



    const renderNotification = (notification: Notification) => (
        <div key={notification.id} className="p-3 border rounded-md">
            <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                    {/* question asker avatar */}
                    <Avatar className="w-6 h-6">
                        <AvatarImage src={notification.question?.user?.image} />
                        <AvatarFallback className="text-xs">
                            {notification.question?.user?.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                    </Avatar>
                    {notification.notification_type === 'answer' && notification.question?.answerer && (
                        <>
                            <div className="w-px h-2 bg-border" />
                            {/* answerer avatar */}
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={notification.question.answerer.image} />
                                <AvatarFallback className="text-xs">
                                    {notification.question.answerer.name?.[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                        </>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium">
                            {notification.notification_type === 'question' ? 'New Question' : 'Question Answered'}
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
                            {notification.notification_type === 'answer' && notification.question.answer && (
                                <div className="text-sm mb-2">
                                    <strong>A:</strong> {notification.question.answer}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>Asked by: {notification.question.user?.name || "Anonymous"}</span>
                                {notification.question.answerer && (
                                    <span>• Answered by: {notification.question.answerer.name}</span>
                                )}
                                {notification.question.problem && (
                                    <span>• Problem: {notification.question.problem.title}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (open) {
            fetchNotifications()
        }
    }

    const handleMarkAsRead = async () => {
        if (!session?.nextjudge_token) return

        try {
            await apiMarkNotificationsAsRead(session.nextjudge_token)
            setLocalNotificationCount(0)
            // optionally refresh notifications to show they're marked as read
            await fetchNotifications()
        } catch (error) {
            console.error("Error marking notifications as read:", error)
        }
    }

    if (!session?.nextjudge_token) {
        return null
    }

    // separate notifications by read status
    const unreadNotifications = localNotifications.filter(n => !n.is_read)
    const readNotifications = localNotifications.filter(n => n.is_read)

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {localNotificationCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {localNotificationCount > 99 ? "99+" : localNotificationCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Recent Notifications</CardTitle>
                            {localNotificationCount > 0 && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleMarkAsRead}
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
                        ) : localNotifications.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent notifications
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto">
                                {/* Unread notifications section */}
                                {unreadNotifications.length > 0 && (
                                    <div className="p-4 pb-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h3 className="text-sm font-medium">Unread</h3>
                                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                                {unreadNotifications.length}
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {unreadNotifications.map(renderNotification)}
                                        </div>
                                    </div>
                                )}

                                {/* Separator between unread and read */}
                                {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                                    <div className="px-4 py-3">
                                        <Separator />
                                    </div>
                                )}

                                {/* Read notifications section */}
                                {readNotifications.length > 0 && (
                                    <div className="p-4 pt-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h3 className="text-sm font-medium text-muted-foreground">Recent</h3>
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
    )
}
