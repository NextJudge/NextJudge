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
import { Language } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";


interface EditorLanguageSelectProps {
  languages: Language[],
  onLanguageSelect: (language: Language) => void;
  defaultLanguage?: Language;
  variant?: "default" | "landing" | "compact";
}

export function EditorLanguageSelect({
  languages,
  onLanguageSelect,
  defaultLanguage,
  variant = "default"
}: EditorLanguageSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [currentLanguage, setCurrentLanguage] = React.useState<Language | undefined>(defaultLanguage);
  const prevDefaultLanguageRef = React.useRef<Language | undefined>(defaultLanguage);

  if (defaultLanguage?.id !== prevDefaultLanguageRef.current?.id) {
    setCurrentLanguage(defaultLanguage);
    prevDefaultLanguageRef.current = defaultLanguage;
  }

  const isLanding = variant === "landing";
  const isCompact = variant === "compact";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isCompact ? "ghost" : "outline"}
          role="combobox"
          aria-expanded={open}
          aria-label={
            currentLanguage
              ? `Programming language: ${currentLanguage.name}`
              : "Select programming language"
          }
          className={cn(
            isCompact
              ? "h-6 w-fit px-2 text-sm font-normal hover:bg-accent"
              : "w-[200px] justify-between",
            isLanding && "bg-black/60 border-osu/50 text-white hover:bg-black/80 hover:text-white"
          )}
        >
          {currentLanguage
            ? isCompact
              ? currentLanguage.name.charAt(0).toUpperCase() + currentLanguage.name.slice(1)
              : `${currentLanguage.name} (${currentLanguage.version})`
            : "Select a language"}
          <CaretSortIcon className={cn(
            "shrink-0 opacity-50",
            isCompact ? "ml-1 h-3.5 w-3.5" : "ml-2 h-4 w-4"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(
        isCompact ? "w-[220px] p-0" : "w-[200px] p-0",
        isLanding && "bg-black/90 border-osu/50"
      )}>
        <Command className={isLanding ? "bg-black/90" : ""}>
          <CommandInput
            placeholder="Search languages..."
            className={cn(
              "h-9",
              isLanding && "text-white"
            )}
          />
          <CommandEmpty className={isLanding ? "text-gray-300" : ""}>
            No language found.
          </CommandEmpty>
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
                className={cn(
                  isLanding && "text-white hover:bg-black/80 aria-selected:bg-black/80"
                )}
              >
                <div className="flex justify-between w-full">
                  <span>{language.name}</span>
                  <span className={cn(
                    "text-sm opacity-70",
                    isLanding ? "text-gray-300" : "text-gray-500"
                  )}>
                    {language.version}
                  </span>
                </div>
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    currentLanguage && currentLanguage.id === language.id
                      ? "opacity-100"
                      : "opacity-0",
                    isLanding && "text-osu"
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
