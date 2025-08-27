"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeContext } from "@/providers/editor-theme";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

export type Theme = {
  name: string;
  fetch: string;
};

export function EditorThemeSelector({ themes }: { themes: Theme[] }) {
  const { theme: currentTheme, setTheme } = React.useContext(ThemeContext);
  const [open, setOpen] = React.useState(false);
  const builtInThemes: Theme[] = [
    { name: "vs-dark", fetch: "" },
    { name: "light", fetch: "" }
  ];

  const allThemes = [...builtInThemes, ...themes];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {currentTheme?.name ? (
            currentTheme.name === "vs-dark" ? "VS Code Dark" :
              currentTheme.name === "light" ? "VS Code Light" :
                currentTheme.name
          ) : "Select theme..."}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search our themes..." className="h-9" />
          <CommandEmpty>No theme found.</CommandEmpty>
          <CommandGroup className="overflow-y-scroll max-h-52">
            {allThemes.map((theme: Theme) => (
              <CommandItem
                key={theme.name}
                value={theme.name}
                onSelect={(currVal: string) => {
                  // Handle built-in themes differently
                  if (theme.name === "vs-dark" || theme.name === "light") {
                    // For built-in themes, we need to use the provider's setTheme differently
                    // But since the provider doesn't handle built-ins, we'll need to work around this
                    setTheme(theme);
                  } else {
                    setTheme(theme);
                  }
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
