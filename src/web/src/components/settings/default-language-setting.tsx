"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGetLanguages } from "@/lib/api";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Language } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DefaultLanguageSetting() {
    const { defaultLanguage, setDefaultLanguage, clearDefaultLanguage } = useSettingsStore();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const data = await apiGetLanguages();
                setLanguages(data);
            } catch (error) {
                console.error('Failed to fetch languages:', error);
                toast.error('Failed to load languages');
            } finally {
                setLoading(false);
            }
        };

        fetchLanguages();
    }, []);

    const handleLanguageChange = (languageId: string) => {
        const selectedLanguage = languages.find(lang => lang.id === languageId);
        if (selectedLanguage) {
            setDefaultLanguage(selectedLanguage);
            toast.success(`Default language set to ${selectedLanguage.name}`);
        }
    };

    const handleClearLanguage = () => {
        clearDefaultLanguage();
        toast.success('Default language cleared');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Default Programming Language</CardTitle>
                <CardDescription>
                    Choose your preferred programming language for the code editor. This will be used as the default when you open a new problem.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="default-language">Default Language</Label>
                    <div className="flex gap-2">
                        <Select
                            value={defaultLanguage?.id || ""}
                            onValueChange={handleLanguageChange}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={loading ? "Loading languages..." : "Select a language"} />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((language) => (
                                    <SelectItem key={language.id} value={language.id}>
                                        {language.name} ({language.version})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {defaultLanguage && (
                            <Button
                                variant="outline"
                                onClick={handleClearLanguage}
                                className="shrink-0"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
                {defaultLanguage && (
                    <div className="text-sm text-muted-foreground">
                        Current default: <span className="font-medium">{defaultLanguage.name} ({defaultLanguage.version})</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
