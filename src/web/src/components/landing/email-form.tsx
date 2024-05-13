"use clients";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function EmailForm({
  sendEmail,
}: {
  sendEmail: (formData: FormData) => void;
}) {
  return (
    <Card className="w-full m-4 md:w-1/2 p-8 space-y-4 border-orange-500/15">
      <div className="mb-4 space-y-4">
        <h2 className="text-lg md:text-2xl font-semibold text-center">
          Be part of the{" "}
          <span
            className=" font-serif italic font-semibold mx-1 underline text-[#FF6600]"
            // Should we remove this gradient?
            // style={{
            //   background: "linear-gradient(transparent 50%, #FF6600 50%)",
            // }}
          >
            future
          </span>{" "}
          of competitive programming
        </h2>
        <p className="text-center text-sm md:text-base text-muted-foreground max-w-md mx-auto">
          Join the waitlist to get early access to NextJudge. <br /> We'll
          notify you when we're ready to onboard new users.{" "}
        </p>
      </div>
      <div>
        <form
          action={sendEmail}
          className="flex w-full flex-col gap-4 md:gap-4 justify-center items-center mx-auto"
        >
          <div className="flex flex-col items-center w-full gap-2">
            <div className="flex flex-row items-center w-full gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                name="name"
                className="w-full"
                type="text"
                required
                placeholder="John Doe"
                aria-label="name"
              />
            </div>
            <div className="flex flex-row items-center w-full gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                type="email"
                className="w-full"
                required
                placeholder="johndoe@oregonstate.edu"
                aria-label="email"
              />
            </div>
          </div>
          <Button
            type="submit"
            className={cn(
              buttonVariants({
                variant: "secondary",
              }),
              "w-full group p-[1px] overflow-hidden relative bg-secondary hover:bg-secondary rounded-md"
            )}
          >
            <span className="absolute inset-[-1000%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_0%_50%,#000000_0%,#000000_80%,#EA580C_100%)] bg-clip-padding" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center bg-primary group-hover:bg-neutral-700 transition-colors dark:group-hover:bg-neutral-300  dark:bg-neutral-200 rounded text-sm font-medium dark:text-neutral-950 text-white backdrop-blur-3xl">
              Join the waitlist
            </span>
          </Button>
        </form>
      </div>
    </Card>
  );
}
