import ParallaxSection from "@/components/parallax";

import "@/styles/layout.css";

import GitHubCorners from "@uiw/react-github-corners";
import { motion } from "framer-motion";
import {
  Parallax,
  ParallaxBanner,
  ParallaxProvider,
} from "react-scroll-parallax";

const BlueBox: React.FC = () => {
  return (
    <div className="w-full max-w-sm lg:flex lg:max-w-full">
      <div
        className="h-48 flex-none overflow-hidden rounded-t bg-cover text-center lg:h-auto lg:w-48 lg:rounded-l lg:rounded-t-none"
        style={{
          backgroundImage: "url('https://picsum.photos/600/400/?random')",
        }}
        title="Woman holding a mug"
      ></div>
      <div className="flex flex-col justify-between rounded-b border-x border-b border-gray-400 bg-white p-4 leading-normal lg:rounded-b-none lg:rounded-r lg:border-l-0 lg:border-t lg:border-gray-400">
        <div className="mb-8">
          <p className="flex items-center text-sm text-gray-600">
            <svg
              className="mr-2 h-3 w-3 fill-current text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M4 8V6a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2h1zm5 6.73V17h2v-2.27a2 2 0 1 0-2 0zM7 6v2h6V6a3 3 0 0 0-6 0z" />
            </svg>
            Members only
          </p>
          <div className="mb-2 text-xl font-bold text-gray-900">
            Can coffee make you a better developer?
          </div>
          <p className="text-base text-gray-700">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Voluptatibus quia, nulla! Maiores et perferendis eaque,
            exercitationem praesentium nihil.
          </p>
        </div>
        <div className="flex items-center">
          <img
            className="mr-4 h-10 w-10 rounded-full"
            src="/img/jonathan.jpg"
            alt="Avatar of Jonathan Reinink"
          />
          <div className="text-sm">
            <p className="leading-none text-gray-900">Jonathan Reinink</p>
            <p className="text-gray-600">Aug 18</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Wrapper = (props) => (
  <ParallaxProvider>
    <div style={{ height: "300vh" }}>
      <div className="flex h-full w-full items-center">{props.children}</div>
    </div>
  </ParallaxProvider>
);

function SomeComponenet() {
  return (
    <Wrapper>
      <h1 className="mx-20 text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
        Our Services
      </h1>
      <Parallax key={1} className="layer" translateY={[-100, 100]}>
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
          Inner
        </h1>
      </Parallax>
    </Wrapper>
  );
}

export const WithABackgroundAndChildren = () => (
  /*
     position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  */
  <Wrapper>
    <ParallaxBanner
      className="layer"
      style={{ aspectRatio: "2 / 1" }}
      layers={[{ className: "layer", speed: 1 }]}
    >
      <div className="absolute inset-0 flow-root flex-row items-center justify-center">
        <div className="mx-24 flex-1" style={{ position: "sticky", top: 0 }}>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
            Our Services
          </h1>
        </div>
        <div className="h-full flex-1">
          <Parallax
            translateX={["-400px", "0px"]}
            scale={[0.75, 1]}
            rotate={[-180, 0]}
            easing="easeInQuad"
          >
            Tom
          </Parallax>
        </div>
      </div>
    </ParallaxBanner>
  </Wrapper>
);

export default function Home() {
  return (
    <main className="layout h-full w-full bg-black bg-fixed text-white selection:bg-white selection:text-black">
      <GitHubCorners
        position="right"
        href="https://github.com/NextJudge/NextJudge"
      />
      <img
        src="/react.svg"
        alt="React.js logo"
        height={150}
        width={150}
        className="absolute left-0 m-6 max-w-[30px] animate-[spin_5s_linear_infinite]"
      />
      <section className="container min-h-full px-4 py-6 md:px-6 md:pt-24 lg:pt-24 xl:pt-24">
        <div className="grid items-center gap-6">
          <div className="flex flex-col justify-center gap-4 space-y-8 text-center">
            <h1
              className="animate-pulse text-3xl font-bold  tracking-tighter hover:cursor-pointer hover:underline sm:text-5xl xl:text-6xl"
              title="NextJudge"
              onClick={() =>
                window.open("https://github.com/nextjudge", "_blank")
              }
            >
              NextJudge
            </h1>
            <h1
              className="mx-auto w-9/12 text-5xl font-bold tracking-tighter sm:text-6xl xl:text-[80px]"
              //   initial={{ opacity: 0 }}
              //   animate={{ opacity: 1 }}
              //   transition={{ staggerChildren: 0.5 }}
            >
              <motion.span
                initial={{ opacity: 0, y: 100, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-r from-purple-600/70 to-blue-600/70 bg-clip-text text-transparent"
              >
                The Last
                <br />
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 100, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                Competitive Programming Framework
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 100, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="bg-gradient-to-r from-blue-600/70 to-purple-600/70 bg-clip-text text-transparent"
              >
                You'll Ever Need <br />
              </motion.span>
            </h1>

            <p className="mx-auto mt-8 max-w-xl text-sm text-white sm:text-base md:text-xl">
              A full-stack competitve programming framework built for contest
              organizers, developers, open-source contributors, and broader
              programming community.
            </p>
          </div>
        </div>
      </section>

      <section className="container min-h-full px-4 py-6 md:px-6 md:pt-24 lg:pt-24 xl:pt-24">
        <div className="grid items-center gap-6">
          <ParallaxSection />
        </div>
      </section>

      <footer className="container mt-10 grid place-items-center py-8 text-neutral-400">
        <span className="flex items-center space-x-2">
          &copy;
          <span>{new Date().getFullYear()}</span>
          <a
            href="https://github.com/NextJudge"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 duration-200 hover:text-white hover:underline"
          >
            NextJudge Team
          </a>
        </span>
      </footer>
    </main>
  );
}
