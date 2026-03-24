from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io
import cv2
import numpy as np
import base64
import logging

# -----------------------
# LOGGING
# -----------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------
# INIT APP
# -----------------------
app = FastAPI(
    title="OsteoScan AI API",
    description="Osteoporosis risk detection from X-ray images",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# DEVICE
# -----------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

# -----------------------
# LOAD MODEL
# -----------------------
def load_model():
    try:
        m = models.resnet18(weights=None)
        m.fc = nn.Linear(m.fc.in_features, 3)
        m.load_state_dict(torch.load("./model/model.pth", map_location=device))
        m.to(device)
        m.eval()
        logger.info("Model loaded successfully")
        return m
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise RuntimeError(f"Model load failed: {e}")

model = load_model()

# -----------------------
# TRANSFORM
# -----------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()           # pixels: 0.0 → 1.0, no normalization
])

# -----------------------
# LABELS & THRESHOLDS
# -----------------------
LABELS = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}

RISK_META = {
    "Low Risk":    {"level": 0, "description": "Bone density appears within normal range."},
    "Medium Risk": {"level": 1, "description": "Some signs of reduced bone density detected."},
    "High Risk":   {"level": 2, "description": "Significant bone density reduction detected."},
}

# -----------------------
# GRAD-CAM
# -----------------------
def generate_gradcam(model: nn.Module, image_tensor: torch.Tensor):
    """
    Generates a Grad-CAM heatmap for the predicted class.
    image_tensor must NOT be inside torch.no_grad() scope.
    """
    gradients = []
    activations = []

    target_layer = model.layer4[-1]

    handle_f = target_layer.register_forward_hook(
        lambda module, inp, out: activations.append(out)
    )
    handle_b = target_layer.register_full_backward_hook(
        lambda module, grad_in, grad_out: gradients.append(grad_out[0])
    )

    try:
        # Forward — gradients ARE tracked here
        output = model(image_tensor)
        pred_class = output.argmax(dim=1).item()

        model.zero_grad()
        output[0, pred_class].backward()

        grads = gradients[0].detach().cpu().numpy()[0]   # (C, H, W)
        acts  = activations[0].detach().cpu().numpy()[0]  # (C, H, W)

        # Global average pooling of gradients
        weights = np.mean(grads, axis=(1, 2))             # (C,)

        # Weighted sum of activation maps
        cam = np.zeros(acts.shape[1:], dtype=np.float32)
        for w, act in zip(weights, acts):
            cam += w * act

        cam = np.maximum(cam, 0)                          # ReLU
        cam = cv2.resize(cam, (224, 224))

        if cam.max() > 0:
            cam = cam / cam.max()                         # Normalize to [0,1]

        return cam, pred_class, output

    finally:
        handle_f.remove()
        handle_b.remove()


def overlay_heatmap(original_pil: Image.Image, cam: np.ndarray) -> str:
    """Overlays Grad-CAM on the original image and returns base64 PNG."""
    orig_rgb = np.array(original_pil.resize((224, 224)))  # RGB numpy

    heatmap_colored = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heatmap_rgb     = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    overlay = cv2.addWeighted(orig_rgb, 0.6, heatmap_rgb, 0.4, 0)
    overlay_bgr = cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)  # imencode expects BGR

    success, buffer = cv2.imencode(".png", overlay_bgr)
    if not success:
        raise RuntimeError("Failed to encode heatmap image")

    return base64.b64encode(buffer).decode("utf-8")


# -----------------------
# ROUTES
# -----------------------
@app.get("/")
def home():
    return {
        "status": "online",
        "model": "ResNet-18",
        "device": str(device),
        "classes": list(LABELS.values())
    }

@app.get("/health")
def health():
    return {"status": "ok", "device": str(device)}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # ── Validate file type ──
    if file.content_type not in ("image/jpeg", "image/png", "image/bmp", "image/tiff"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG or PNG."
        )

    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read image: {e}")

    try:
        # ── Prepare tensor — keep grad tracking ON for Grad-CAM ──
        image_tensor = transform(pil_image).unsqueeze(0).to(device)
        image_tensor.requires_grad_(True)   # ← critical fix

        # ── Grad-CAM (handles forward + backward internally) ──
        cam, pred_class, raw_output = generate_gradcam(model, image_tensor)

        # ── Probabilities (no_grad is fine here — we already have cam) ──
        with torch.no_grad():
            probs = torch.softmax(raw_output.detach(), dim=1)[0]

        prob_low    = round(probs[0].item(), 4)
        prob_medium = round(probs[1].item(), 4)
        prob_high   = round(probs[2].item(), 4)

        # Risk score = weighted combination (0–1 scale)
        risk_score = round(0.0 * prob_low + 0.5 * prob_medium + 1.0 * prob_high, 4)

        label = LABELS[pred_class]

        # ── Build heatmap overlay ──
        heatmap_b64 = overlay_heatmap(pil_image, cam)

        logger.info(f"Prediction: {label} | risk_score={risk_score:.3f} | file={file.filename}")

        return {
            "prediction":   label,
            "class":        pred_class,
            "risk_score":   risk_score,
            "description":  RISK_META[label]["description"],
            "heatmap":      heatmap_b64,
            "probabilities": {
                "low":    prob_low,
                "medium": prob_medium,
                "high":   prob_high,
            },
            "model_info": {
                "architecture": "ResNet-18",
                "device": str(device),
            }
        }

    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")