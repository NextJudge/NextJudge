import { Hero } from "@/components/landing/hero";
import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex max-w-screen flex-col items-center justify-between overflow-x-hidden">
        <Hero />
      </main>
    </>
  );
}
