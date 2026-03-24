import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePredict = async () => {
    if (!file) {
      alert("Upload an image first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h1>Osteoporosis Risk Detection</h1>

      <input type="file" onChange={handleUpload} />
      <br /><br />

      <button onClick={handlePredict}>Predict</button>

      {result && result.probabilities && (
        <div style={{ marginTop: "20px" }}>
          <h2>Prediction: {result.prediction}</h2>
          <p>Low: {result.probabilities.low.toFixed(2)}</p>
          <p>Medium: {result.probabilities.medium.toFixed(2)}</p>
          <p>High: {result.probabilities.high.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default App;