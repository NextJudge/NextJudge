import type { PropsWithChildren } from "react";
import React from "react";
import type { ValidScrollAxis } from "parallax-controller";
import { ParallaxProvider } from "react-scroll-parallax";

export default function ScrollContainer(
  props: PropsWithChildren<{
    scrollAxis?: ValidScrollAxis;
  }>
) {
  const [scrollEl, setScrollElement] = React.useState(null);
  const ref = React.useRef<any>();

  React.useEffect(() => {
    setScrollElement(ref.current);
  }, []);

  return (
    <div className="scroll-container" ref={ref}>
      <ParallaxProvider
        scrollContainer={scrollEl}
        scrollAxis={props.scrollAxis}
      >
        {props.children}
      </ParallaxProvider>
    </div>
  );
}
