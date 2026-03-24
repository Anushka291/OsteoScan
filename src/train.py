# src/train.py

import os
import pandas as pd
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.model_selection import train_test_split

# Paths
DATA_DIR = "./data"
IMG_DIR = os.path.join(DATA_DIR, "boneage-training-dataset")

# Load data
boneage_df = pd.read_csv(os.path.join(DATA_DIR, "boneage-training-dataset.csv"))
labels_df = pd.read_csv(os.path.join(DATA_DIR, "train_labels.csv"))

df = pd.merge(boneage_df, labels_df, on="id")

# Split
train_df, test_df = train_test_split(df, test_size=0.2, stratify=df['risk_class'])

# Dataset class
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

# Transform
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor()
])

# DataLoader
train_dataset = BoneDataset(train_df, IMG_DIR, transform)
test_dataset = BoneDataset(test_df, IMG_DIR, transform)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32)

# Model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, 3)
model = model.to(device)

# Loss & optimizer
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

# Train
for epoch in range(5):
    model.train()
    total_loss = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {total_loss}")

# Save model
torch.save(model.state_dict(), "./model/model.pth")

print("Training complete ✅")
