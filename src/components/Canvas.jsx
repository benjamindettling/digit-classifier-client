import { useRef, useState, useEffect } from "react";
import axios from "axios";

import { useTranslation } from "react-i18next";

const Canvas = ({ setPrediction, setLoading }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [loading, setInternalLoading] = useState(false);
  const { t } = useTranslation();

  // Get position from touch event
  const getTouchPos = (touchEvent) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = touchEvent.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  // Start drawing on canvas (mouse or touch)
  const startDrawing = (e) => {
    e.preventDefault();
    const isTouch = e.type.includes("touch");
    const pos = isTouch
      ? getTouchPos(e)
      : {
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY,
        };
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    // Add dot immediately on tap/click (not just when moving)
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setLastPos(pos);
    setIsDrawing(true);
  };

  // Draw a line from the last position to current
  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const isTouch = e.type.includes("touch");
    const pos = isTouch
      ? getTouchPos(e)
      : {
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY,
        };

    requestAnimationFrame(() => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setLastPos(pos);
    });
  };

  // Stop drawing
  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  // Clear canvas and reset prediction
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction("\u00A0"); //empty white space that ensures same height
  };

  // Resize and center the drawn digit to 28x28 MNIST format
  const centerAndResizeImage = (sourceCanvas) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext("2d");

    // Get image data from original canvas
    const ctx = sourceCanvas.getContext("2d");
    const original = ctx.getImageData(
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height
    );
    const data = original.data;

    // Find bounding box
    let minX = 280,
      minY = 280,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < 280; y++) {
      for (let x = 0; x < 280; x++) {
        const i = (y * 280 + x) * 4;
        if (data[i] < 255) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const boxSize = Math.max(width, height);

    // Crop & center to square
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = boxSize;
    croppedCanvas.height = boxSize;
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.fillStyle = "white";
    croppedCtx.fillRect(0, 0, boxSize, boxSize);
    croppedCtx.drawImage(
      sourceCanvas,
      minX,
      minY,
      width,
      height,
      0,
      0,
      boxSize,
      boxSize
    );

    // Downscale and center into 28x28
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, 28, 28);
    tempCtx.drawImage(croppedCanvas, 4, 4, 20, 20);

    return tempCanvas;
  };

  // Check if canvas is blank (all white)
  const isCanvasBlank = (canvas) => {
    const context = canvas.getContext("2d");
    const pixelBuffer = new Uint32Array(
      context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some((color) => color !== 0xffffffff); // true if all white
  };

  // Predict digit from current canvas drawing
  const predictDrawing = async () => {
    const canvas = canvasRef.current;

    // Check for blank canvas
    if (isCanvasBlank(canvas)) {
      console.warn("Canvas is blank – skipping prediction.");
      setPrediction(null);
      return;
    }

    const tempCanvas = centerAndResizeImage(canvas);

    tempCanvas.toBlob(async (blob) => {
      if (!blob) {
        console.error("Blob generation failed. Aborting prediction.");
        setPrediction("Error generating image. Please try again.");
        setInternalLoading(false);
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", blob, "canvas.png");

      setInternalLoading(true);
      setLoading(true);
      setPrediction(null);

      const predictOnce = async () => {
        return await axios.post(
          "https://mnist-api-8p5a.onrender.com/predict",
          formData
        );
      };

      try {
        let res;
        try {
          res = await predictOnce();
        } catch (firstError) {
          // Second try
          console.warn("First attempt failed, retrying...");
          res = await predictOnce();
        }

        setPrediction(res.data.prediction);
      } catch (err) {
        console.error("Prediction failed after retry:", err);
        setPrediction("Error");
      } finally {
        setInternalLoading(false);
        setLoading(false);
      }
    }, "image/png");
  };

  // Clear the canvas on component mount
  useEffect(() => {
    clearCanvas();
  }, []);

  return (
    <div className="mb-3">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        className="bg-white rounded shadow-lg"
        style={{ touchAction: "none" }}
      />
      <div className="d-flex justify-content-center gap-3 mt-3">
        <a
          className="cta-btn cta-btn--resume"
          role="button"
          tabIndex="0"
          onClick={clearCanvas}
          disabled={loading}
        >
          {t("clear")}
        </a>
        <a
          className="cta-btn cta-btn--resume"
          onClick={predictDrawing}
          disabled={loading}
        >
          {loading ? t("predicting") : t("predict")}
        </a>
      </div>
    </div>
  );
};

export default Canvas;
