"use client";

import { deleteAccount } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_COPY } from "@/lib/site";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

const CONFIRMATION_PHRASE = "DELETE";

export function DeleteAccountSetting() {
  const { data: session } = useSession();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const userEmail = session?.user?.email ?? "";
  const isConfirmationValid =
    confirmation === CONFIRMATION_PHRASE ||
    (userEmail.length > 0 && confirmation === userEmail);

  const handleOpenChange = (nextOpen: boolean) => {
    if (pending) {
      return;
    }
    setOpen(nextOpen);
    if (!nextOpen) {
      setConfirmation("");
    }
  };

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      return;
    }

    setPending(true);
    try {
      const result = await deleteAccount();
      if (result?.status === "error") {
        toast.error(result.message);
        setPending(false);
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
      setPending(false);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>{SITE_COPY.deleteAccountCardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>{SITE_COPY.deleteAccountDialogCredentials}</p>
                  <p>{SITE_COPY.deleteAccountDialogStandings}</p>
                  <p>{SITE_COPY.deleteAccountDialogReRegister}</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-account-confirmation">
                Type <span className="font-mono font-semibold text-foreground">{CONFIRMATION_PHRASE}</span>
                {userEmail ? (
                  <>
                    {" "}
                    or your email <span className="font-mono font-semibold text-foreground">{userEmail}</span>
                  </>
                ) : null}{" "}
                to confirm
              </Label>
              <Input
                id="delete-account-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                disabled={pending}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending || !isConfirmationValid}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {pending ? "Deleting..." : "Delete account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
