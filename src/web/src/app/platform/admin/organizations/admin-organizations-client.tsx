"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import {
  apiCreateClass,
  apiCreateOrganization,
  apiDeleteOrganization,
  apiGetOrganizationClasses,
  apiGetOrganizations,
  apiImportClassRoster,
  ClassRoom,
  Organization,
} from "@/lib/api";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export default function AdminOrganizationsClient() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [className, setClassName] = useState("");
  const [classTerm, setClassTerm] = useState("");
  const [rosterCsv, setRosterCsv] = useState("email,name,role\n");

  const token = session?.nextjudge_token;

  const fetchOrganizations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGetOrganizations(token);
      setOrganizations(data);
      if (!selectedOrgId && data.length > 0) {
        setSelectedOrgId(data[0].id);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, selectedOrgId, toast]);

  const fetchClasses = useCallback(async () => {
    if (!token || !selectedOrgId) {
      setClasses([]);
      return;
    }
    try {
      const data = await apiGetOrganizationClasses(token, selectedOrgId);
      setClasses(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to load classes", variant: "destructive" });
    }
  }, [token, selectedOrgId, toast]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateOrganization = async () => {
    if (!token) return;
    try {
      await apiCreateOrganization(token, {
        slug,
        name,
        description,
      });
      setSlug("");
      setName("");
      setDescription("");
      await fetchOrganizations();
      toast({ title: "Organization created" });
    } catch (error) {
      toast({
        title: "Could not create organization",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!token) return;
    try {
      await apiDeleteOrganization(token, orgId);
      if (selectedOrgId === orgId) {
        setSelectedOrgId("");
      }
      await fetchOrganizations();
      toast({ title: "Organization deleted" });
    } catch (error) {
      toast({
        title: "Could not delete organization",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleCreateClass = async () => {
    if (!token || !selectedOrgId) return;
    try {
      await apiCreateClass(token, selectedOrgId, {
        name: className,
        term: classTerm,
      });
      setClassName("");
      setClassTerm("");
      await fetchClasses();
      toast({ title: "Class created" });
    } catch (error) {
      toast({
        title: "Could not create class",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleImportRoster = async (classId: string) => {
    if (!token) return;
    try {
      const result = await apiImportClassRoster(token, classId, rosterCsv);
      toast({
        title: "Roster imported",
        description: `Added ${result.added}, skipped ${result.skipped}`,
      });
    } catch (error) {
      toast({
        title: "Roster import failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading organizations...</p>;
  }

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Organizations</h3>
          <p className="text-sm text-muted-foreground">
            Create organizations, classes, and import CSV rosters.
          </p>
        </div>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="cs-department"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CS Department"
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label htmlFor="org-description">Description</Label>
          <Textarea
            id="org-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button type="button" onClick={handleCreateOrganization}>
          Create organization
        </Button>

        <Separator />

        <div className="space-y-3">
          <Label htmlFor="org-select">Select organization</Label>
          <select
            id="org-select"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
          >
            <option value="">Select...</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.slug})
              </option>
            ))}
          </select>
        </div>

        {organizations.map((org) => (
          <div
            key={org.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="font-medium">{org.name}</p>
              <p className="text-sm text-muted-foreground">{org.slug}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDeleteOrganization(org.id)}
            >
              Delete
            </Button>
          </div>
        ))}

        {selectedOrgId && (
          <>
            <Separator />
            <div>
              <h4 className="text-base font-medium">Classes</h4>
              <p className="text-sm text-muted-foreground">
                Classes in the selected organization.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="class-name">Class name</Label>
                <Input
                  id="class-name"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="class-term">Term</Label>
                <Input
                  id="class-term"
                  value={classTerm}
                  onChange={(e) => setClassTerm(e.target.value)}
                  placeholder="Fall 2026"
                />
              </div>
            </div>
            <Button type="button" onClick={handleCreateClass}>
              Create class
            </Button>

            <div className="space-y-3">
              {classes.map((classRoom) => (
                <div
                  key={classRoom.id}
                  className="rounded-md border p-3 space-y-2"
                >
                  <p className="font-medium">{classRoom.name}</p>
                  {classRoom.term && (
                    <p className="text-sm text-muted-foreground">
                      {classRoom.term}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleImportRoster(classRoom.id)}
                  >
                    Import roster CSV
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Label htmlFor="roster-csv">Roster CSV</Label>
              <Textarea
                id="roster-csv"
                value={rosterCsv}
                onChange={(e) => setRosterCsv(e.target.value)}
                rows={6}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
