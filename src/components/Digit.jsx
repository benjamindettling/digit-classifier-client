import { useState } from "react";
import axios from "axios";
import CanvasDraw from "./Canvas";

const DigitSection = () => {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("file", imageFile);

    setLoading(true);
    setPrediction(null);

    try {
      const res = await axios.post(
        "https://mnist-api-8p5a.onrender.com/predict",
        formData
      );
      setPrediction(res.data.prediction);
    } catch (err) {
      console.error("Prediction failed:", err);
      setPrediction("Error");
    } finally {
      setLoading(false);
    }
  };

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
