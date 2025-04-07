import { useRef, useState, useEffect } from "react";
import axios from "axios";

const Canvas = ({ setPrediction, setLoading }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [loading, setInternalLoading] = useState(false);

  const getTouchPos = (touchEvent) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = touchEvent.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

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
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setLastPos(pos);
    setIsDrawing(true);
  };

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

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
  };

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

    // Create temporary cropped and centered canvas
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

    // Draw to 28x28 canvas centered
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, 28, 28);
    tempCtx.drawImage(croppedCanvas, 4, 4, 20, 20);

    // Invert image
    const imageData = tempCtx.getImageData(0, 0, 28, 28);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i];
      imageData.data[i + 1] = 255 - imageData.data[i + 1];
      imageData.data[i + 2] = 255 - imageData.data[i + 2];
    }
    tempCtx.putImageData(imageData, 0, 0);

    return tempCanvas;
  };

  const predictDrawing = async () => {
    const canvas = canvasRef.current;
    const tempCanvas = centerAndResizeImage(canvas);

    tempCanvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "canvas.png");

      setInternalLoading(true);
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
        setInternalLoading(false);
        setLoading(false);
      }
    }, "image/png");
  };

  useEffect(() => {
    clearCanvas();
  }, []);

  return (
    <div className="digit-wrapper__input">
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
        className="canvas-board"
        style={{ touchAction: "none" }}
      />
      <div className="d-flex gap-2">
        <a>
          <button className="cta-btn cta-btn--resume" onClick={clearCanvas}>
            Clear
          </button>
        </a>
        <a>
          <button
            className="cta-btn cta-btn--resume"
            onClick={predictDrawing}
            disabled={loading}
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
        </a>
      </div>
    </div>
  );
};

export default Canvas;
