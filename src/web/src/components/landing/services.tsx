"use client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import Lottie from "lottie-react";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import {
  PanelsLeftBottomIcon,
  SettingsIcon,
  TerminalSquareIcon,
} from "lucide-react";
import animationData from "../../../public//lottie/lottie.json";
import dynamic from "next/dynamic";

interface ServiceProps {
  title: string;
  description: string;
  icon: JSX.Element;
}

const serviceList: ServiceProps[] = [
  {
    title: "NextJudge Platform",
    description:
      "All of our services packaged into this user-friendly, web-based platform.",
    icon: <PanelsLeftBottomIcon className="w-6 h-6 text-osu opacity-80" />,
  },
  {
    title: "NextJudge Framework",
    description:
      "An extensible backend framework for building competitive programming platforms and organizing your own ICPC-style contests.",
    icon: <SettingsIcon className="w-6 h-6 text-osu opacity-80" />,
  },
  {
    title: "NextJudge CLI",
    description:
      "A simple command-line interface for interacting with the NextJudge framework through your terminal.",
    icon: <TerminalSquareIcon className="w-6 h-6 text-osu opacity-80" />,
  },
];

export const Services = () => {
  return (
    <section className="container py-24 sm:py-32" id="services">
      <div className="grid lg:grid-cols-[1fr,1fr] gap-8 place-items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-medium font-sans">
            The{" "}
            <span className="bg-gradient-to-br from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
              Ultimate{" "}
            </span>
            Coding Arena
          </h2>

          <p className="text-muted-foreground text-xl mt-4 mb-8 ">
            Whether you&apos;re a beginner or an seasoned veteran in competitive
            programming, we&apos;ve got you covered.
          </p>

          <div className="flex flex-col gap-8">
            {serviceList.map(({ icon, title, description }: ServiceProps) => (
              <Card key={title}>
                <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
                  <div className="mt-1 dark:bg-neutral-900 bg-neutral-100 shadow p-1 rounded">
                    {icon}
                  </div>
                  <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="text-md mt-2">
                      {description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        <Lottie
          animationData={animationData}
          className="w-[300px] md:w-[500px] lg:w-[600px] object-contain"
          loop={10}
          autoPlay
        />
      </div>
    </section>
  );
};
