import os
import pandas as pd
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models

# -----------------------
# PATHS
# -----------------------
DATA_DIR = "./data"
IMG_DIR = os.path.join(DATA_DIR, "boneage-training-dataset")
VAL_IDS_PATH = os.path.join(DATA_DIR, "val_ids.csv")
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
# LOAD VAL IDS
# -----------------------
val_df = pd.read_csv(VAL_IDS_PATH)

results = []

# -----------------------
# PREDICT LOOP
# -----------------------
for _, row in val_df.iterrows():
    img_id = row['id']
    img_path = os.path.join(IMG_DIR, f"{img_id}.png")

    try:
        image = Image.open(img_path).convert("RGB")
        image = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(image)
            probs = torch.softmax(outputs, dim=1)
            pred = torch.argmax(probs, dim=1).item()

        results.append({
            "id": img_id,
            "predicted_class": pred,
            "prob_class_0": probs[0][0].item(),
            "prob_class_1": probs[0][1].item(),
            "prob_class_2": probs[0][2].item()
        })

    except Exception as e:
        print(f"Error processing {img_id}: {e}")

# -----------------------
# SAVE RESULTS
# -----------------------
results_df = pd.DataFrame(results)

output_path = "./data/val_predictions.csv"
results_df.to_csv(output_path, index=False)

print("Predictions saved to:", output_path)