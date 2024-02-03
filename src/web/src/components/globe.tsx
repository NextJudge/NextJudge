/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";

const ARC_REL_LEN = 1.4; // relative to whole arc
const FLIGHT_TIME = 1000;
const NUM_RINGS = 3;
const RINGS_MAX_R = 5; // deg
const RING_PROPAGATION_SPEED = 5; // deg/sec

const World = () => {
  const [arcsData, setArcsData] = useState([]);
  const [ringsData, setRingsData] = useState([]);
  const globeEl = useRef<any>();

  // Override globe material controls
  useLayoutEffect(() => {
    if (!globeEl.current) return;
    globeEl.current.controls().enableZoom = false;
    globeEl.current.controls().autoRotate = true;
    globeEl.current.controls().autoRotateSpeed = 2.7;
  }, []);

  const prevCoords = useRef({ lat: 0, lng: 0 });
  const emitArc = useCallback(({ lat: endLat, lng: endLng }: any) => {
    const { lat: startLat, lng: startLng } = prevCoords.current;
    prevCoords.current = { lat: endLat, lng: endLng };

    // add and remove arc after 1 cycle
    const arc = { startLat, startLng, endLat, endLng };
    setArcsData((curArcsData) => [...curArcsData, arc] as any);
    setTimeout(
      () => setArcsData((curArcsData) => curArcsData.filter((d) => d !== arc)),
      FLIGHT_TIME * 2
    );

    // add and remove start rings
    const srcRing = { lat: startLat, lng: startLng };
    setRingsData((curRingsData) => [...curRingsData, srcRing] as any);
    setTimeout(
      () =>
        setRingsData((curRingsData) =>
          curRingsData.filter((r) => r !== srcRing)
        ),
      FLIGHT_TIME * ARC_REL_LEN
    );

    // add and remove target rings
    setTimeout(() => {
      const targetRing = { lat: endLat, lng: endLng };
      setRingsData((curRingsData) => [...curRingsData, targetRing] as any);
      setTimeout(
        () =>
          setRingsData((curRingsData) =>
            curRingsData.filter((r) => r !== targetRing)
          ),
        FLIGHT_TIME * ARC_REL_LEN
      );
    }, FLIGHT_TIME);
  }, []);

  useLayoutEffect(() => {
    // every .5 seconds, add 3 random arcs
    const interval = setInterval(() => {
      emitArc({
        lat: (Math.random() - 0.5) * 180,
        lng: (Math.random() - 0.5) * 360,
      });
      emitArc({
        lat: (Math.random() - 0.5) * 180,
        lng: (Math.random() - 0.5) * 360,
      }),
        emitArc({
          lat: (Math.random() - 0.5) * 180,
          lng: (Math.random() - 0.5) * 360,
        });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Globe
        height={700}
        width={700}
        showAtmosphere={true}
        ref={globeEl}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        onGlobeClick={emitArc}
        arcsData={arcsData}
        arcColor={() => "rgb(66, 0, 209)"}
        arcDashLength={ARC_REL_LEN}
        arcDashGap={2}
        arcDashInitialGap={1}
        arcDashAnimateTime={FLIGHT_TIME}
        arcsTransitionDuration={0}
        ringsData={ringsData}
        ringColor={() => (t: any) => `rgba(66, 0, 209, ${1 - t})`}
        ringMaxRadius={RINGS_MAX_R}
        ringPropagationSpeed={RING_PROPAGATION_SPEED}
        ringRepeatPeriod={(FLIGHT_TIME * ARC_REL_LEN) / NUM_RINGS}
      />
    </>
  );
};

export default World;
