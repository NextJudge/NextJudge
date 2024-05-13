"use client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  PanelsLeftBottomIcon,
  SettingsIcon,
  TerminalSquareIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import animationData from "../../../public//lottie/lottie.json";
import { BorderBeam } from "./beam";
import { items } from "./bento";
// import Lottie from "lottie-react";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface ServiceProps {
  title: string;
  description: string;
  icon: JSX.Element;
  id: number;
}

const serviceList: ServiceProps[] = [
  {
    id: 0,
    title: "NextJudge Platform",
    description:
      "All of our services packaged into this user-friendly, web-based platform.",
    icon: <PanelsLeftBottomIcon className="w-6 h-6 text-osu opacity-80" />,
  },
  {
    id: 1,
    title: "NextJudge Framework",
    description:
      "An extensible backend framework for building competitive programming platforms and organizing custom ICPC-style contests.",
    icon: <SettingsIcon className="w-6 h-6 text-osu opacity-80" />,
  },
  {
    id: 2,
    title: "NextJudge CLI",
    description:
      "A simple command-line interface for interacting with the NextJudge framework through your terminal.",
    icon: <TerminalSquareIcon className="w-6 h-6 text-osu opacity-80" />,
  },
];

export const Services = () => {
  const [parent] = useAutoAnimate({ easing: "linear", duration: 500 });
  const [selectedCard, setSelectedCard] = useState<number | null>(1);
  const handleCardClick = (id: number) => {
    if (selectedCard === id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(id);
    }
  };

  return (
    <section className="container py-4 max-w-7xl" id="services">
      <div className="grid lg:grid-cols-[1fr,1fr] gap-8 place-items-center items-start">
        <div>
          <h2 className="text-3xl md:text-4xl font-medium font-sans">
            The{" "}
            <span className="bg-gradient-to-br from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
              Ultimate{" "}
            </span>
            Coding Arena
          </h2>

          <p className="text-muted-foreground text-xl mt-4 mb-4 ">
            Whether you&apos;re a beginner or an seasoned veteran in competitive
            programming, we&apos;ve got you covered.
          </p>

          <i className="text-muted-foreground text-lg">
            Select a service to learn more.
          </i>

          <div className="flex flex-col gap-8 mt-4">
            {serviceList.map(
              ({ icon, title, description, id }: ServiceProps) => (
                <Card
                  key={title}
                  onClick={() => handleCardClick(id)}
                  className={cn(
                    "cursor-pointer duration-300 transition-all",
                    selectedCard === id && "bg-osu/10 scale-95"
                  )}
                >
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
              )
            )}
          </div>
        </div>
        <div className="flex justify-center" ref={parent}>
          {selectedCard === 0 ? (
            <>
              <PlatformItems />
            </>
          ) : selectedCard === 1 ? (
            <FrameworkExample />
          ) : (
            <>
              <LottieAnimation />
            </>
          )}
        </div>
      </div>
    </section>
  );
};

const PlatformItems = () => {
  return (
    <div className="grid grid-cols-1 gap-4 max-h-[600px] m-4 p-2 overflow-scroll">
      {items.slice(1, 4).map((item) => (
        <div key={item.title} className="flex flex-col gap-4">
          <div>{item.header}</div>
        </div>
      ))}
    </div>
  );
};

const LottieAnimation = () => {
  return (
    <Lottie
      animationData={animationData}
      className="w-[200px] md:w-[400px] lg:w-[500px] object-contain"
      loop={true}
      autoPlay
    />
  );
};

const FrameworkExample = () => {
  return (
    <div className="relative rounded-lg">
      <Image
        src="/demo/framework.svg"
        width={600}
        height={500}
        alt="NextJudge Framework"
        className={cn(
          "hidden dark:flex",
          "rounded-lg shadow-lg",
          "object-cover",
          "w-full sm:h-[300px] md:h-[400px] lg:h-[700px]"
        )}
      />
      <Image
        src="/demo/framework-light.svg"
        width={600}
        height={500}
        alt="NextJudge Framework"
        className={cn(
          "dark:hidden flex",
          "rounded-lg shadow-lg",
          "object-cover",
          "w-full sm:h-[300px] md:h-[400px] lg:h-[700px]"
        )}
      />
      <BorderBeam />
    </div>
  );
};
