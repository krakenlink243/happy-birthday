import { useState } from "react";
import ImageStack from "./components/ImageStack";

function App() {
  const [stage, setStage] = useState("stack");

  return (
    <>
      {stage === "stack" && (
        <ImageStack onFinish={() => setStage("cake")} />
      )}

      {stage === "cake" && (
        <div
          style={{
            color: "white",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            background: "black"
          }}
        >
          🎂 Cake stage coming next…
        </div>
      )}
    </>
  );
}

export default App;