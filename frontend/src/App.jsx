import { useState, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #050810;
    --surface: #0c1120;
    --surface2: #111827;
    --border: rgba(99,179,237,0.12);
    --border-glow: rgba(99,179,237,0.35);
    --accent: #63b3ed;
    --accent2: #90cdf4;
    --low: #68d391;
    --medium: #f6ad55;
    --high: #fc8181;
    --text: #e2e8f0;
    --muted: #718096;
    --mono: 'DM Mono', monospace;
    --display: 'Syne', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--mono);
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
    position: relative;
    overflow: hidden;
  }

  /* Background grid */
  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* Ambient glow */
  .app::after {
    content: '';
    position: fixed;
    top: -20%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(99,179,237,0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── HEADER ── */
  .header {
    position: relative;
    z-index: 1;
    padding: 28px 40px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    background: rgba(5,8,16,0.7);
  }

  .logo-group { display: flex; align-items: center; gap: 14px; }

  .logo-icon {
    width: 40px; height: 40px;
    border: 1.5px solid var(--accent);
    border-radius: 10px;
    display: grid; place-items: center;
    position: relative;
    background: rgba(99,179,237,0.07);
  }
  .logo-icon svg { width: 20px; height: 20px; stroke: var(--accent); fill: none; }

  .logo-text {
    font-family: var(--display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text);
  }
  .logo-sub {
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 1px;
  }

  .header-badge {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    border: 1px solid var(--border-glow);
    padding: 5px 12px;
    border-radius: 20px;
    background: rgba(99,179,237,0.05);
  }

  /* ── MAIN ── */
  .main {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 24px 60px;
    align-items: start;
  }

  @media (max-width: 768px) {
    .main { grid-template-columns: 1fr; }
  }

  /* ── PANEL ── */
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    position: relative;
    overflow: hidden;
  }

  .panel-left {
    border-right: none;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .panel-right {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid var(--border);
    min-height: 500px;
  }

  @media (max-width: 768px) {
    .panel-left { border-radius: 16px 16px 0 0; border-right: 1px solid var(--border); border-bottom: none; }
    .panel-right { border-radius: 0 0 16px 16px; border-left: 1px solid var(--border); border-top: none; }
  }

  .section-label {
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── DROP ZONE ── */
  .drop-zone {
    border: 1.5px dashed var(--border-glow);
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s ease;
    background: rgba(99,179,237,0.02);
    position: relative;
    overflow: hidden;
  }
  .drop-zone:hover, .drop-zone.active {
    border-color: var(--accent);
    background: rgba(99,179,237,0.06);
  }
  .drop-zone input {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
  }

  .drop-icon {
    width: 48px; height: 48px;
    margin: 0 auto 16px;
    border: 1.5px solid var(--border-glow);
    border-radius: 12px;
    display: grid; place-items: center;
    background: rgba(99,179,237,0.05);
  }
  .drop-icon svg { width: 22px; height: 22px; stroke: var(--accent); fill: none; }
  .drop-title {
    font-family: var(--display);
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
  }
  .drop-sub { font-size: 11px; color: var(--muted); letter-spacing: 0.04em; }

  /* ── PREVIEW ── */
  .preview-wrap {
    margin-top: 20px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
    position: relative;
    background: #000;
  }
  .preview-wrap img {
    width: 100%;
    max-height: 220px;
    object-fit: contain;
    display: block;
  }
  .preview-badge {
    position: absolute;
    top: 10px; right: 10px;
    background: rgba(5,8,16,0.85);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    backdrop-filter: blur(6px);
  }

  /* ── FILE META ── */
  .file-meta {
    margin-top: 14px;
    padding: 12px 14px;
    background: var(--surface2);
    border-radius: 8px;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }
  .file-meta-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .file-name { color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-size { color: var(--muted); flex-shrink: 0; }

  /* ── ANALYZE BTN ── */
  .btn-analyze {
    width: 100%;
    margin-top: 20px;
    padding: 14px;
    background: var(--accent);
    color: #050810;
    border: none;
    border-radius: 10px;
    font-family: var(--display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .btn-analyze::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .btn-analyze:hover:not(:disabled)::before { opacity: 1; }
  .btn-analyze:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,179,237,0.3); }
  .btn-analyze:active:not(:disabled) { transform: translateY(0); }
  .btn-analyze:disabled {
    background: var(--surface2);
    color: var(--muted);
    cursor: not-allowed;
    border: 1px solid var(--border);
  }

  /* ── LOADING ── */
  .loading-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px 20px;
    color: var(--muted);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pulse-ring {
    width: 60px; height: 60px;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: var(--accent);
    border-right-color: rgba(99,179,237,0.3);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-dots { display: flex; gap: 6px; }
  .loading-dots span {
    width: 4px; height: 4px; border-radius: 50%; background: var(--accent); opacity: 0.3;
    animation: dot-fade 1.2s ease infinite;
  }
  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot-fade { 0%,100%{opacity:0.3} 50%{opacity:1} }

  /* ── EMPTY STATE ── */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; padding: 60px 20px;
    color: var(--muted); font-size: 11px; letter-spacing: 0.08em; text-align: center;
  }
  .empty-state svg { width: 40px; height: 40px; stroke: rgba(99,179,237,0.2); fill: none; }

  /* ── RESULTS ── */
  .result-block { animation: fade-up 0.4s ease; }
  @keyframes fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  /* Risk verdict */
  .verdict {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .verdict::before {
    content: '';
    position: absolute; inset: 0;
    opacity: 0.06;
  }
  .verdict.low  { border-color: rgba(104,211,145,0.4); }
  .verdict.low::before { background: var(--low); }
  .verdict.medium { border-color: rgba(246,173,85,0.4); }
  .verdict.medium::before { background: var(--medium); }
  .verdict.high  { border-color: rgba(252,129,129,0.4); }
  .verdict.high::before { background: var(--high); }

  .verdict-label {
    font-family: var(--display);
    font-size: 22px;
    font-weight: 800;
    position: relative;
  }
  .verdict-label.low { color: var(--low); }
  .verdict-label.medium { color: var(--medium); }
  .verdict-label.high { color: var(--high); }

  .verdict-score {
    position: relative;
    text-align: right;
  }
  .verdict-score-num {
    font-family: var(--display);
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
  }
  .verdict-score-label {
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    margin-top: 4px;
  }

  /* Prob bars */
  .prob-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .prob-row { display: flex; flex-direction: column; gap: 5px; }
  .prob-header { display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
  .prob-track {
    height: 4px; border-radius: 99px; background: var(--surface2); overflow: hidden;
  }
  .prob-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .prob-fill.low  { background: var(--low); }
  .prob-fill.medium { background: var(--medium); }
  .prob-fill.high  { background: var(--high); }

  /* Heatmap */
  .heatmap-wrap {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
    position: relative;
  }
  .heatmap-wrap img { width: 100%; display: block; }
  .heatmap-label {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 10px 14px;
    background: linear-gradient(transparent, rgba(5,8,16,0.9));
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* Disclaimer */
  .disclaimer {
    margin-top: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(113,128,150,0.05);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.04em;
    line-height: 1.7;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .disclaimer svg { width: 14px; height: 14px; stroke: var(--muted); fill: none; flex-shrink: 0; margin-top: 1px; }
`;

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
  };

  const handleUpload = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch {
      alert("Error connecting to backend");
    }
    setLoading(false);
  };

  const riskClass = result
    ? result.prediction === "Low Risk" ? "low"
    : result.prediction === "Medium Risk" ? "medium"
    : "high"
    : "";

  const formatSize = (bytes) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="logo-group">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </div>
            <div>
              <div className="logo-text">OsteoScan</div>
              <div className="logo-sub">AI Screening System</div>
            </div>
          </div>
          <div className="header-badge">v2.1 · Clinical Research</div>
        </header>

        {/* Main */}
        <main className="main">
          {/* Left Panel — Upload */}
          <div className="panel panel-left">
            <div className="section-label">Input</div>

            <div
              className={`drop-zone ${dragging ? "active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} />
              <div className="drop-icon">
                <svg viewBox="0 0 24 24" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="drop-title">Drop X-Ray Image</div>
              <div className="drop-sub">or click to browse · PNG, JPG, DICOM</div>
            </div>

            {preview && (
              <div className="preview-wrap">
                <img src={preview} alt="X-ray preview" />
                <div className="preview-badge">X-Ray Preview</div>
              </div>
            )}

            {file && (
              <div className="file-meta">
                <div className="file-meta-dot" />
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatSize(file.size)}</span>
              </div>
            )}

            <button
              className="btn-analyze"
              onClick={handlePredict}
              disabled={!file || loading}
            >
              {loading ? "Analyzing…" : "Run Analysis"}
            </button>
          </div>

          {/* Right Panel — Results */}
          <div className="panel panel-right">
            <div className="section-label">Results</div>

            {loading && (
              <div className="loading-wrap">
                <div className="pulse-ring" />
                <div>Processing scan</div>
                <div className="loading-dots">
                  <span/><span/><span/>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" strokeWidth="1">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <path d="M11 8v6M8 11h6"/>
                </svg>
                <span>Upload an X-ray image<br/>and run analysis to see results</span>
              </div>
            )}

            {!loading && result && result.probabilities && (
              <div className="result-block">
                {/* Verdict */}
                <div className={`verdict ${riskClass}`}>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Assessment</div>
                    <div className={`verdict-label ${riskClass}`}>{result.prediction}</div>
                  </div>
                  <div className="verdict-score">
                    <div className={`verdict-score-num`} style={{ color: riskClass === "low" ? "var(--low)" : riskClass === "medium" ? "var(--medium)" : "var(--high)" }}>
                      {result.risk_score.toFixed(2)}
                    </div>
                    <div className="verdict-score-label">Risk Score</div>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="section-label" style={{ marginBottom: 14 }}>Probabilities</div>
                <div className="prob-grid">
                  {[
                    { label: "Low Risk", key: "low", val: result.probabilities.low },
                    { label: "Medium Risk", key: "medium", val: result.probabilities.medium },
                    { label: "High Risk", key: "high", val: result.probabilities.high },
                  ].map(({ label, key, val }) => (
                    <div className="prob-row" key={key}>
                      <div className="prob-header">
                        <span style={{ color: "var(--muted)" }}>{label}</span>
                        <span style={{ color: "var(--text)" }}>{(val * 100).toFixed(1)}%</span>
                      </div>
                      <div className="prob-track">
                        <div className={`prob-fill ${key}`} style={{ width: `${val * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heatmap */}
                <div className="section-label" style={{ margin: "20px 0 14px" }}>Attention Map</div>
                <div className="heatmap-wrap">
                  <img src={`data:image/png;base64,${result.heatmap}`} alt="Grad-CAM heatmap" />
                  <div className="heatmap-label">Grad-CAM · Model Attention Overlay</div>
                </div>

                {result && result.image_info && (
                  <div style={{ marginTop: "20px" }}>
                  <h3>Image Info:</h3>
                  <p>Width: {result.image_info.width}px</p>
                  <p>Height: {result.image_info.height}px</p>
                  <p>Resolution: {result.image_info.resolution}</p>
                  <p>Format: {result.image_info.format}</p>
                  </div>
                )}  

                {/* Disclaimer */}
                <div className="disclaimer">
                  <svg viewBox="0 0 24 24" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  AI-assisted screening tool. Results are not a medical diagnosis. Consult a licensed radiologist or physician for clinical decisions.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}