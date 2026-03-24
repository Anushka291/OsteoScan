import os
import torch
import torch.nn as nn
import pandas as pd

from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# -----------------------
# PATHS
# -----------------------
DATA_DIR = "./data"
IMG_DIR = os.path.join(DATA_DIR, "boneage-training-dataset")

# -----------------------
# LOAD DATA
# -----------------------
boneage_df = pd.read_csv(os.path.join(DATA_DIR, "boneage-training-dataset.csv"))
labels_df = pd.read_csv(os.path.join(DATA_DIR, "train_labels.csv"))

df = pd.merge(boneage_df, labels_df, on="id")

# SAME SPLIT AS TRAINING
_, test_df = train_test_split(
    df,
    test_size=0.2,
    stratify=df['risk_class'],
    random_state=42
)

# -----------------------
# DATASET CLASS
# -----------------------
class BoneDataset(Dataset):
    def __init__(self, df, img_dir, transform=None):
        self.df = df.reset_index(drop=True)
        self.img_dir = img_dir
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = os.path.join(self.img_dir, f"{row['id']}.png")
        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        label = int(row['risk_class'])
        return image, label

# -----------------------
# TRANSFORMS + LOADER
# -----------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

test_dataset = BoneDataset(test_df, IMG_DIR, transform)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

# -----------------------
# LOAD MODEL
# -----------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.resnet18(weights=None)  # IMPORTANT
model.fc = nn.Linear(model.fc.in_features, 3)

model.load_state_dict(torch.load("./model/model.pth", map_location=device))
model.to(device)
model.eval()

# -----------------------
# EVALUATION
# -----------------------
all_preds = []
all_labels = []

with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)
        preds = torch.argmax(outputs, dim=1)

        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

# -----------------------
# METRICS
# -----------------------
acc = accuracy_score(all_labels, all_preds)

print("Accuracy:", acc)
print("\nClassification Report:\n", classification_report(all_labels, all_preds))
print("\nConfusion Matrix:\n", confusion_matrix(all_labels, all_preds))