import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Your confusion matrix
cm = np.array([
    [1462, 28, 1],
    [26, 441, 0],
    [1, 25, 160]
])

# Class labels
labels = ["Low", "Medium", "High"]

# Plot
plt.figure(figsize=(6,5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=labels,
            yticklabels=labels)

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")

plt.tight_layout()
plt.show()