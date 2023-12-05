import { useRef, useState } from "react";
import { ReactSketchCanvas, CanvasPath } from "react-sketch-canvas";
import { shapeSimilarity } from "curve-matcher";
import countries from "./countries.json";
import confetti from "canvas-confetti";

const dailyCountry = countries[new Date().getDate()];
const dailyCountryCoordinates = (async () => {
  return getCountryBorders(dailyCountry);
})();

console.log(`You'd find it anyway... Today's country is ${dailyCountry}`);

const canvasProps = {
  className: "react-sketch-canvas",
  width: "100%",
  height: "100%",
  strokeWidth: 4,
  strokeColor: "#fff",
  canvasColor: "#242424",
  style: { border: "none" },
  svgStyle: {},
  exportWithBackgroundImage: false,
  withTimestamp: true,
  allowOnlyPointerType: "all",
  withViewBox: false,
};

function App() {
  const [score, setScore] = useState(0);
  const canvasRef = useRef<any>();

  const onStroke = async (stroke: CanvasPath) => {
    const countryBorders = await dailyCountryCoordinates;

    const newScore = shapeSimilarity(
      stroke.paths,
      countryBorders.map(([x, y]) => ({ x, y })),
    );

    setScore(newScore);
    if (newScore > 95) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const onPointerDown = () => {
    canvasRef.current.clearCanvas();
  };

  return (
    <div className="app">
      <div style={{ padding: 10 }}>
        <h1>Bordle</h1>
        <p>
          Guess the <b>country of the day</b> by <b>drawing the borders</b>{" "}
          below!
        </p>
        {score ? (
          <div>
            <div>Score : {Math.round(+score)}%</div>
            {score > 95
              ? `Congratulations! The country was ${dailyCountry}!`
              : null}
          </div>
        ) : (
          <br />
        )}
      </div>
      <div className="canvas" onPointerDownCapture={onPointerDown}>
        <ReactSketchCanvas
          {...canvasProps}
          ref={canvasRef}
          onStroke={onStroke}
        />
      </div>
    </div>
  );
}

export default App;

async function getCountryBorders(country: string) {
  const response = await fetch(
    `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/world-administrative-boundaries/records?select=geo_shape&where=name%20%3D%20%22${country}%22&limit=1`,
  );
  const json = await response.json();
  const geometry = json.results[0]?.geo_shape.geometry;

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates[0][0];
  }
  return geometry.coordinates[0];
}
