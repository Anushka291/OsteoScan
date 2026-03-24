from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io

# -----------------------
# INIT APP
# -----------------------
app = FastAPI()

# Enable CORS (for frontend later)
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

# -----------------------
# LOAD MODEL
# -----------------------
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 3)

model.load_state_dict(torch.load("./model/model.pth", map_location=device))
model.to(device)
model.eval()

# -----------------------
# TRANSFORM
# -----------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# -----------------------
# LABELS
# -----------------------
labels = {
    0: "Low Risk",
    1: "Medium Risk",
    2: "High Risk"
}

# -----------------------
# ROOT ENDPOINT
# -----------------------
@app.get("/")
def home():
    return {"message": "Osteoporosis AI API is running 🚀"}

# -----------------------
# PREDICTION ENDPOINT
# -----------------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        image = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(image)
            probs = torch.softmax(outputs, dim=1)
            pred = torch.argmax(probs, dim=1).item()

        return {
            "prediction": labels[pred],
            "class": pred,
            "probabilities": {
                "low": probs[0][0].item(),
                "medium": probs[0][1].item(),
                "high": probs[0][2].item()
            }
        }

    except Exception as e:
        return {"error": str(e)}