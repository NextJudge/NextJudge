import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Submission } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RecentSubmissionCard } from "./recent-submissions";

interface SubmissionDrawerProps {
  submissions?: Submission[];
}

export default function SubmissionDrawer({ submissions  }: SubmissionDrawerProps) {
  const safeSubmissions = Array.isArray(submissions) ? submissions : [];

  return (
    <div>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" className="flex text-sm">
            View All
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Your Submissions</DrawerTitle>
            <DrawerDescription>
              See your submissions to both this problem and this category.
            </DrawerDescription>
          </DrawerHeader>

          <div className="mx-6 flex flex-col gap-4">
            <Tabs defaultValue="problem" className={cn("w-full max-h-96")}>
              <TabsList>
                <TabsTrigger value="problem">Problem</TabsTrigger>
                <TabsTrigger value="category">Category</TabsTrigger>
              </TabsList>
              <TabsContent value="problem">
                {safeSubmissions.length > 0 ? (
                  <ul className="grid grid-flow-row grid-cols-3 gap-4">
                    {safeSubmissions.map((submission) => (
                      <RecentSubmissionCard
                        submission={submission}
                        key={submission.id}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-muted-foreground mb-2">No submissions yet</div>
                    <div className="text-sm text-muted-foreground">
                      Start solving problems to see your submissions here
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="category">
                {safeSubmissions.length > 0 ? (
                  <ul className="grid grid-flow-row grid-cols-3 gap-4">
                    {safeSubmissions.map((submission) => (
                      <RecentSubmissionCard
                        submission={submission}
                        key={submission.id}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-muted-foreground mb-2">No submissions yet</div>
                    <div className="text-sm text-muted-foreground">
                      Start solving problems to see your submissions here
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <DrawerFooter className={cn("mt-4 w-full")}>
            <DrawerClose>
              <Button className="w-full" variant="outline">
                Done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
