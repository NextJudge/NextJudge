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
import { cn } from "@/lib/utils";
import { recentSubmissions } from "../data/data";
import { RecentSubmissionCard } from "./recent-submissions";

export default function SubmissionDrawer() {
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
                <ul className="grid grid-flow-row grid-cols-3 gap-4">
                  {recentSubmissions.map((submission) => (
                    <RecentSubmissionCard
                      submission={submission}
                      key={submission.id}
                    />
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="category">
                <ul className="grid grid-flow-row grid-cols-3 gap-4">
                  {recentSubmissions.map((submission) => (
                    <RecentSubmissionCard
                      submission={submission}
                      key={submission.id}
                    />
                  ))}
                </ul>
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
