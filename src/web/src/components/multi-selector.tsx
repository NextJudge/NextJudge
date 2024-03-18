"use client";

import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [checkedItems, setCheckedItems] = React.useState<Item[]>([]);

  const handleCheckedChange = (item: Item, checked: boolean) => {
    if (checked) {
      setCheckedItems([...checkedItems, item]);
    } else {
      setCheckedItems(checkedItems.filter((i) => i.id !== item.id));
    }
  };

  React.useEffect(() => {
    setSelectedItems(checkedItems);
  }, [checkedItems, setSelectedItems]);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {type === "problems" ? "Add problems" : "Add participants"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>
            {type === "problems" ? "Problems" : "Participants"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
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
        </DropdownMenuContent>
      </DropdownMenu>
      {/* {children} */} {/* maybe we support this in the future? */}
    </>
  );
}
