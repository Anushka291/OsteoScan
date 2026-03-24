import os
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models

# -----------------------
# PATHS
# -----------------------
IMG_PATH = "./data/boneage-training-dataset/10514.png"  # change ID

MODEL_PATH = "./model/model.pth"

# -----------------------
# DEVICE
# -----------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# -----------------------
# LOAD MODEL
# -----------------------
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 3)

model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
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
# LOAD IMAGE
# -----------------------
image = Image.open(IMG_PATH).convert("RGB")
image = transform(image).unsqueeze(0)  # add batch dimension
image = image.to(device)

# -----------------------
# PREDICTION
# -----------------------
with torch.no_grad():
    outputs = model(image)
    probs = torch.softmax(outputs, dim=1)
    pred = torch.argmax(probs, dim=1).item()

# -----------------------
# CLASS LABELS
# -----------------------
labels = {
    0: "Low Risk",
    1: "Medium Risk",
    2: "High Risk"
}

print("Prediction:", labels[pred])
print("Probabilities:", probs.cpu().numpy())