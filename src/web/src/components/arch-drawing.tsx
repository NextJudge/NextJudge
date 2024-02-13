import { useEffect, useRef } from "react";

interface ArchDrawingProps {
  children: React.ReactNode;
}
const ArchDrawing: React.FC<ArchDrawingProps> = () => {
  const arch1Ref = useRef<SVGPathElement | null>(null);
  const arch2Ref = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const arch1 = arch1Ref.current;
    const arch2 = arch2Ref.current;

    if (arch1 && arch2) {
      const length1 = arch1.getTotalLength();
      const length2 = arch2.getTotalLength();

      arch1.style.strokeDasharray = `${length1}`;
      arch2.style.strokeDasharray = `${length2}`;

      arch1.style.strokeDashoffset = `${length1}`;
      arch2.style.strokeDashoffset = `${length2}`;

      const handleScroll = () => {
        const scrollPercent =
          (document.body.scrollTop + document.documentElement.scrollTop) /
          (document.documentElement.scrollHeight -
            document.documentElement.clientHeight);

        const draw1 = length1 * scrollPercent;
        const draw2 = length2 * scrollPercent;

        arch1.style.strokeDashoffset = `${length1 - draw1}`;
        arch2.style.strokeDashoffset = `${length2 - draw2}`;
      };

      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h2>Scroll down this window to draw two reflecting arches.</h2>
      <p>Scroll back up to reverse the drawing.</p>

      <div className="flex justify-center space-x-64">
        <svg id="mySVG1" className="mySVG">
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: "rgb(255,0,0)", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "rgb(0,255,0)", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            ref={arch1Ref}
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="3"
            id="arch1"
            d="M150 0 Q75 100 150 200 Q225 100 150 0"
          />
          Sorry, your browser does not support inline SVG.
        </svg>

        <svg id="mySVG2" className="mySVG">
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: "rgb(255,0,0)", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "rgb(0,255,0)", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            ref={arch2Ref}
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="3"
            id="arch2"
            d="M150 0 Q225 100 150 200 Q75 100 150 0"
          />
          Sorry, your browser does not support inline SVG.
        </svg>
      </div>
    </div>
  );
};

const Main: React.FC = () => {
  return (
    <div>
      <ArchDrawing children />
    </div>
  );
};

export default Main;
