"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

export type Language = {
  id: number;
  name: string;
  extension: string;
  version: string;
};

interface EditorLanguageSelectProps {
  languages: Language[];
  setCurrentLanguage: (language: string) => void;
}

const defaultLanguages: Language[] = [
  {
    id: 1,
    name: "TypeScript",
    extension: ".tsx",
    version: "5.4.3"
  },

  {
    id: 2,
    name: "C",
    extension: ".c",
    version: "C17"
  },

  {
    id: 3,
    name: "JavaScript",
    extension: ".js",
    version: "ES6"
  },

  {
  id: 4,
  name: "Python",
  extension: ".py",
  version: "3.8"
  },
];

export function EditorLanguageSelect() {
  const [open, setOpen] = React.useState(false);
  const [currentLanguage, setCurrentLanguage] = React.useState(defaultLanguages[0]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {currentLanguage.name}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search languages..." className="h-9" />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="overflow-y-scroll max-h-52">
            {defaultLanguages.map((language) => (
              <CommandItem
                key={language.id}
                value={language.name}
                onSelect={() => {
                  setCurrentLanguage(language);
                  setOpen(false);
                }}
              >
                {language.name}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    currentLanguage.id === language.id
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
