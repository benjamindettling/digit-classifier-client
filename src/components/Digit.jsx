import { useState, useEffect } from "react";
import axios from "axios";
import CanvasDraw from "./Canvas";

const DigitSection = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Wake up server on initial load
  useEffect(() => {
    const pingServer = async () => {
      setPrediction("Waking up server...");
      try {
        await fetch("https://mnist-api-8p5a.onrender.com/predict", {
          method: "POST",
          body: new FormData(), // Empty form just to ping
        });
        setPrediction(null);
      } catch (err) {
        console.log("Ping expectedly failed (no file):", err);
        setPrediction(null);
      }
    };

    pingServer();
  }, []);

  return (
    <section id="digit">
      <div className="container">
        <h2 className="section-title">AI Digit Classifier</h2>
        <div className="digit-wrapper">
          <CanvasDraw setPrediction={setPrediction} setLoading={setLoading} />

          <div className="digit-wrapper__output">
            <h2>AI's prediction is:</h2>
            {prediction !== null && (
              <div className="digit-result">{prediction}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DigitSection;
