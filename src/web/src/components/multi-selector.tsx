"use client";

import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

type Checked = DropdownMenuCheckboxItemProps["checked"];

// These are just temporary, we'll of course need to change them once we hook everything up.
interface Item {
  id: number;
  title?: string;
  username?: string;
}

interface DropdownMenuCheckboxesProps {
  items: Item[] | any;
  setSelectedItems: (selectedItems: Item[]) => void;
  selectedItems: Item[];
  type?: "problems" | "participants";
  children?: React.ReactNode;
}

export function DropdownMenuCheckboxes({
  items,
  setSelectedItems,
  selectedItems,
  type,
  children,
}: DropdownMenuCheckboxesProps) {
  const handleCheckedChange = (item: Item, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    }
  };
  const getButtonText = () => {
    const count = selectedItems.length;
    if (count === 0) {
      return type === "problems" ? "Select problems" : "Select participants";
    }
    return type === "problems"
      ? `${count} problem${count !== 1 ? 's' : ''} selected`
      : `${count} participant${count !== 1 ? 's' : ''} selected`;
  };

  return (
    <div className="space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {getButtonText()}
            <Badge variant="secondary" className="ml-2">
              {selectedItems.length}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>
            {type === "problems" ? "Available Problems" : "Available Participants"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-48">
            {items?.map((item: any) => (
              <DropdownMenuCheckboxItem
                key={item.id}
                checked={selectedItems.some((i) => i.id === item.id)}
                onCheckedChange={(checked) => handleCheckedChange(item, checked)}
              >
                {type === "problems" ? (
                  <div className="flex items-center space-x-2">
                    <span>{item.title}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>{item.username}</span>
                  </div>
                )}
              </DropdownMenuCheckboxItem>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Selected {type === "problems" ? "problems" : "participants"}:
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item) => (
              <Badge key={item.id} variant="default" className="text-xs">
                {type === "problems" ? item.title : item.username}
                <button
                  onClick={() => handleCheckedChange(item, false)}
                  className="ml-1 hover:bg-destructive/20 rounded-sm"
                  type="button"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
