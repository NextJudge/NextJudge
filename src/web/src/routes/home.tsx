import "@/styles/layout.css";

import GitHubCorners from "@uiw/react-github-corners";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Parallax,
  ParallaxBanner,
  ParallaxProvider,
} from "react-scroll-parallax";

import { HoverEffect } from "../components/grid-hover";
import { LampContainer } from "../components/lamp";

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

const Wrapper = (props: any) => (
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
  const navigate = useNavigate();
  return (
    <main className="layout h-screen w-full overflow-x-hidden bg-black bg-fixed text-white selection:bg-white selection:text-black">
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
      <section className="container py-6 lg:pt-24 xl:pt-24">
        <div className="grid items-center lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 space-y-8 text-center">
            <h1
              className="text-white/800 mx-8 translate-y-10 text-center text-xl font-bold tracking-tighter hover:cursor-pointer  hover:underline lg:text-left"
              title="NextJudge"
              onClick={() =>
                window.open("https://github.com/nextjudge", "_blank")
              }
            >
              BETA
            </h1>
            <div className="flex shrink grow flex-col items-start justify-start py-8 text-left">
              <h1 className="mx-auto text-5xl font-bold tracking-tighter lg:mx-4 lg:text-6xl">
                <motion.span
                  initial={{ opacity: 0, y: 100, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-purple-600 to-blue-600 bg-clip-text text-center font-bold tracking-tighter text-transparent md:text-6xl lg:text-7xl"
                >
                  NextJudge
                </motion.span>
              </h1>

              <p className="mx-auto mt-8 w-5/6 max-w-sm shrink grow text-center text-lg font-light text-white/80 md:max-w-lg md:text-xl lg:mx-4 lg:w-4/6 lg:text-left lg:text-xl">
                An ergonomic online judge built for competitive programming
                contest organizers, developers, and the broader programming
                community.
              </p>

              <div className="mx-auto mt-8 lg:mx-4">
                <button
                  className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-[0.5px] focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                  onClick={() => navigate("/early-access")}
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    Sign Up for Early Access
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className=" mx-auto mt-6 sm:w-[500px] lg:mt-12 lg:w-[900px] lg:-translate-x-28">
            <img
              src="/preview.png"
              alt="App preview"
              className="inset-0 box-border h-auto w-full rounded-lg border-4 border-white/5 bg-gradient-to-r from-purple-600/70 to-blue-600/70 object-cover shadow-2xl "
            />
          </div>
        </div>
      </section>

      <section className="mt-12 flex flex-col items-center justify-center py-6 lg:pt-24 xl:pt-24">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-5xl">
          What's in NextJudge?
        </h1>
        <p className="mx-auto mb-8 w-5/6 max-w-sm shrink grow text-center text-lg font-light text-white/80 md:my-2 md:max-w-lg md:text-xl lg:mx-4 lg:w-4/6 lg:text-left lg:text-xl">
          All you need to become a competitive programming god.
        </p>
        <LampContainer>
          <HoverEffect />
        </LampContainer>
      </section>
      {/* <section className="container min-h-full px-4 py-6 lg:px-6 lg:pt-24 lg:pt-24 xl:pt-24">
        <div className="grid items-center gap-6">
          <ParallaxSection />
        </div>
      </section> */}
    </main>
  );
}
