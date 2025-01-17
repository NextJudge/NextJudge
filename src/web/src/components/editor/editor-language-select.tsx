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
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { Language } from "@/lib/types";


interface EditorLanguageSelectProps {
  languages: Language[],
  onLanguageSelect: (language: Language) => void;
  defaultLanguage: Language
}

export function EditorLanguageSelect({
  languages,
  onLanguageSelect,
  defaultLanguage
}: EditorLanguageSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [currentLanguage, setCurrentLanguage] = React.useState<Language>(defaultLanguage);

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
