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
import { defaultLanguage } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { fetchLanguages as apiFetchLanguages } from "@/lib/api";

export type Language = {
  id: number;
  name: string;
  extension: string;
  version: string;
};

interface EditorLanguageSelectProps {
  onLanguageSelect: (language: Language) => void;
}

export function EditorLanguageSelect({
  onLanguageSelect,
}: EditorLanguageSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] =
    React.useState<Language>(defaultLanguage);

  React.useEffect(() => {
    async function fetchLanguages() {
      try {
        const data = await apiFetchLanguages()
        setLanguages(data);
      } catch (error) {
        console.error("Failed to fetch languages", error);
      }
    }
    fetchLanguages();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {currentLanguage
            ? `${currentLanguage.name} (${currentLanguage.version})`
            : "Select a language"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search languages..." className="h-9" />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="overflow-y-scroll max-h-52">
            {languages.map((language: Language) => (
              <CommandItem
                key={language.id}
                value={language.name}
                onSelect={() => {
                  onLanguageSelect(language);
                  setCurrentLanguage(language);
                  setOpen(false);
                }}
              >
                <div className="flex justify-between w-full">
                  <span>{language.name}</span>
                  <span className="text-sm text-gray-500 opacity-70">
                    {language.version}
                  </span>
                </div>
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    currentLanguage?.id === language.id
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
