"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";

type CategorySelectorProps = {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  description?: string;
  error?: string;
};

export const CategorySelector = ({
  categories,
  selectedIds,
  onChange,
  label = "Categories",
  description = "Select relevant categories for this problem.",
  error,
}: CategorySelectorProps) => {
  const [open, setOpen] = useState(false);

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedIds.includes(category.id)),
    [categories, selectedIds],
  );

  const handleToggle = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId));
      return;
    }
    onChange([...selectedIds, categoryId]);
  };

  const handleRemove = (categoryId: string) => {
    onChange(selectedIds.filter((id) => id !== categoryId));
  };

  const triggerLabel =
    selectedIds.length === 0
      ? `Select ${label.toLowerCase()}`
      : `${selectedIds.length} selected`;

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{triggerLabel}</span>
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleToggle(category.id)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(category.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedCategories.map((category) => (
            <Badge key={category.id} variant="secondary" className="gap-1 pr-1">
              {category.name}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${category.name}`}
                onClick={() => handleRemove(category.id)}
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <FormDescription>{description}</FormDescription>
      {error ? <FormMessage>{error}</FormMessage> : null}
    </FormItem>
  );
};
