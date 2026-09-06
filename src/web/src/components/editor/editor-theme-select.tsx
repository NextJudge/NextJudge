"use client";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { Palette } from "lucide-react";
import * as React from "react";

export type Theme = {
  name: string;
  fetch: string;
};

export function EditorThemeSelector({
  themes,
  variant = "default",
}: {
  themes: Theme[];
  variant?: "default" | "compact";
}) {
  const { theme: currentTheme, setTheme } = React.useContext(ThemeContext);
  const [open, setOpen] = React.useState(false);
  const builtInThemes: Theme[] = [
    { name: "vs-dark", fetch: "" },
    { name: "light", fetch: "" }
  ];

  const allThemes = [...builtInThemes, ...themes];

  const isCompact = variant === "compact";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isCompact ? "ghost" : "outline"}
          role="combobox"
          aria-expanded={open}
          className={cn(
            isCompact
              ? "h-6 w-6 p-1"
              : "w-[200px] justify-between"
          )}
          title="Editor theme"
          aria-label="Editor theme"
        >
          {isCompact ? (
            <Palette className="!w-3.5 !h-3.5" />
          ) : (
            <>
              {currentTheme?.name ? (
                currentTheme.name === "vs-dark" ? "VS Code Dark" :
                  currentTheme.name === "light" ? "VS Code Light" :
                    currentTheme.name
              ) : "Select theme..."}
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(isCompact ? "w-[220px] p-0" : "w-[200px] p-0")}>
        <Command>
          <CommandInput placeholder="Search our themes..." className="h-9" />
          <CommandList className="max-h-52">
            <CommandEmpty>No theme found.</CommandEmpty>
            <CommandGroup>
              {allThemes.map((theme: Theme) => (
                <CommandItem
                  key={theme.name}
                  value={theme.name}
                  onSelect={() => {
                    setTheme(theme);
                    setOpen(false);
                  }}
                >
                  {theme.name === "vs-dark" ? "VS Code Dark" :
                    theme.name === "light" ? "VS Code Light" :
                      theme.name}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentTheme?.name === theme.name
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
