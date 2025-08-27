"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";

type UserSelectorProps = {
    users: User[];
    loading: boolean;
    onUserSelect: (userId: string) => void;
    existingParticipants?: User[];
    multiple?: boolean;
};

export function UserSelector({
    users,
    loading,
    onUserSelect,
    existingParticipants = [],
    multiple = false,
}: UserSelectorProps) {
    const [open, setOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const existingParticipantIds = existingParticipants.map(p => p.id);
    const availableUsers = users.filter(user => !existingParticipantIds.includes(user.id));

    const handleUserSelect = (userId: string) => {
        if (multiple) {
            const newSelection = selectedUsers.includes(userId)
                ? selectedUsers.filter(id => id !== userId)
                : [...selectedUsers, userId];
            setSelectedUsers(newSelection);
        } else {
            onUserSelect(userId);
            setOpen(false);
        }
    };

    const handleAddSelected = () => {
        selectedUsers.forEach(userId => onUserSelect(userId));
        setSelectedUsers([]);
        setOpen(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-sm text-muted-foreground">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {multiple
                            ? `Select users (${selectedUsers.length} selected)`
                            : "Select a user..."
                        }
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search users..." className="h-9" />
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="h-64">
                                {availableUsers.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={`${user.name} ${user.email}`}
                                        onSelect={() => handleUserSelect(user.id)}
                                    >
                                        <div className="flex items-center space-x-3 w-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.image} alt={user.name} />
                                                <AvatarFallback>
                                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{user.name}</div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                            {multiple && (
                                                <CheckIcon
                                                    className={cn(
                                                        "h-4 w-4",
                                                        selectedUsers.includes(user.id)
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </ScrollArea>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {multiple && selectedUsers.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium">Selected users:</div>
                    <div className="space-y-1">
                        {selectedUsers.map(userId => {
                            const user = users.find(u => u.id === userId);
                            return user ? (
                                <div key={userId} className="flex items-center space-x-2 text-sm">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.image} alt={user.name} />
                                        <AvatarFallback className="text-xs">
                                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{user.name}</span>
                                    <span className="text-muted-foreground">({user.email})</span>
                                </div>
                            ) : null;
                        })}
                    </div>
                    <Button onClick={handleAddSelected} className="w-full">
                        Add {selectedUsers.length} participant{selectedUsers.length > 1 ? 's' : ''}
                    </Button>
                </div>
            )}

            {existingParticipants.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        Current participants ({existingParticipants.length}):
                    </div>
                    <ScrollArea className="h-32">
                        <div className="space-y-1">
                            {existingParticipants.map(user => (
                                <div key={user.id} className="flex items-center space-x-2 text-sm p-2 rounded-md bg-muted/50">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.image} alt={user.name} />
                                        <AvatarFallback className="text-xs">
                                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{user.name}</span>
                                    <span className="text-muted-foreground">({user.email})</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
