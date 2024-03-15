"use client";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

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
import { Heebo } from "next/font/google";

export type Theme = {
  name: string;
  fetch: string;
};

export function EditorThemeSelector({
  themes,
  onSelect,
  selectedTheme,
}: {
  themes: Theme[];
  onSelect: (theme: Theme) => void;
  selectedTheme: Theme | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(
    selectedTheme?.name.toUpperCase() || ""
  );
  //   const [themes, setThemes] = React.useState<Theme[]>([]);

  //   React.useEffect(() => {
  //     (async () => {
  //       const response = await fetch(
  //         "http://localhost:3000/themes/themelist.json"
  //       );
  //       const data = await response.json();
  //       const themes = Object.keys(data).map((theme) => ({
  //         name: theme,
  //         fetch: `http://localhost:3000/themes/${data[theme]}.json`,
  //       }));
  //       setThemes(themes);
  //     })();
  //   }, []);

  console.log({
    themes,
    selectedTheme,
    onSelect,
    value,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? themes.find((theme: any) => selectedTheme?.name === theme.name)
                ?.name
            : "Editor theme..."}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search our themes..." className="h-9" />
          <CommandEmpty>No theme found.</CommandEmpty>
          <CommandGroup className="overflow-y-scroll max-h-52">
            {themes.map((theme: Theme) => (
              <CommandItem
                key={theme.name}
                value={theme.name}
                onSelect={(currVal: string) => {
                  //   console.log(currentValue, value, theme.name, "This is it");
                  //   setValue(currentValue === value ? "" : currentValue);
                  setValue(theme.name);
                  onSelect(theme);
                  setOpen(false);
                }}
              >
                {theme.name}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === theme.name ? "opacity-100" : "opacity-0"
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
