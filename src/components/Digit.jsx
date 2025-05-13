import { useState, useEffect } from "react";
import CanvasDraw from "./Canvas";
import { useTranslation } from "react-i18next";

const DigitSection = () => {
  const [prediction, setPrediction] = useState(null); // Stores predicted digit from backend
  const [loading, setLoading] = useState(false); // Indicates loading state during prediction
  const [serverReady, setServerReady] = useState(false); // Tracks if backend is awake
  const { t } = useTranslation();

  // Wake up the server on load (in case Render fell asleep)
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
    <section id="digit" className="py-5 bg-light">
      <div className="container text-center">
        <h1 className="display-3 fw-bold mb-4"> {t("title")} </h1>
        {!serverReady && (
          <div className="my-4">
            <h4 className="text-muted"> {t("waking_up")} </h4>
            <p className="text-secondary"> {t("wait_time")} </p>
          </div>
        )}

        {serverReady && (
          <div className="row justify-content-center align-items-center min-vh-50 py-5">
            {/* Canvas column */}
            <div className="col-md-6 d-flex justify-content-center">
              <CanvasDraw
                setPrediction={setPrediction}
                setLoading={setLoading}
              />
            </div>

            {/* Prediction column */}
            <div className="col-md-4 d-flex flex-column justify-content-center align-items-center text-center">
              <h3 className="mb-3"> {t("prediction_label")} </h3>
              <div
                className="fw-bold text-white"
                style={{
                  minHeight: "4rem",
                  fontSize: "6rem",
                  textShadow: "2px 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                {prediction !== null ? prediction : t("empty")}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DigitSection;
