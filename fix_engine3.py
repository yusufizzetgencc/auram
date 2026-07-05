import re

with open('engine/index.ts', 'r') as f:
    content = f.read()

content = content.replace("    guvenilirlik: 80,\n", "")

with open('engine/index.ts', 'w') as f:
    f.write(content)

