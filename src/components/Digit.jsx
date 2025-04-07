import { useState, useEffect } from "react";
import axios from "axios";
import CanvasDraw from "./Canvas";

const DigitSection = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  // Wake up the server on load
  useEffect(() => {
    const wakeUp = async () => {
      try {
        const res = await fetch("https://mnist-api-8p5a.onrender.com/ping");
        const data = await res.json();
        if (data.status === "alive") {
          setServerReady(true);
        }
      } catch (err) {
        console.log("Waiting for server to wake...");
        setTimeout(wakeUp, 3000); // Retry every 3 seconds until it's ready
      }
    };

    wakeUp();
  }, []);

  return (
    <section id="digit">
      <div className="container">
        <h2 className="section-title">AI Digit Classifier</h2>

        {!serverReady && (
          <div className="digit-wrapper__output">
            <h2 className="text-color-light">Waking up server...</h2>
            <div className="digit-result">This may take 30–60 seconds</div>
          </div>
        )}

        {serverReady && (
          <div className="digit-wrapper">
            <CanvasDraw setPrediction={setPrediction} setLoading={setLoading} />

            <div className="digit-wrapper__output">
              <h2>AI's prediction is:</h2>
              {prediction !== null && (
                <div className="digit-result">{prediction}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DigitSection;
