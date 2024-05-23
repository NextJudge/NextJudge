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
import { cn, getBridgeUrl } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

export type Language = {
  id: number;
  name: string;
  extension: string;
  version: string;
};

// TODO: Fix these URLs

// getBridgeUrl is now located in src\web\src\lib\utils.ts

// export function getBaseUrl() {
//   return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
//     ? `https://nextjudge.org`
//     : process.env.NEXT_PUBLIC_VERCEL_URL
//     ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
//     : `http://localhost:3001`;
// }

interface EditorLanguageSelectProps {
  onLanguageSelect: (language: Language) => void;
}

export function EditorLanguageSelect({ onLanguageSelect }: EditorLanguageSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = React.useState<Language | null>(
    null
  );

  React.useEffect(() => {
    async function fetchLanguages() {
      try {
        // const response = await fetch(`${getBridgeUrl()}/api/languages`);
        const response = await fetch(`/api/languages`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setLanguages(data);
        setCurrentLanguage(data[0]);
        onLanguageSelect(data[0]);
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
            {languages.map((language: any) => (
              <CommandItem
                key={language.id}
                value={language.name}
                onSelect={() => {
                  setCurrentLanguage(language);
                  onLanguageSelect(language);
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
