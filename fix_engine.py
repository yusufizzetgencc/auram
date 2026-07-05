import re

with open('engine/index.ts', 'r') as f:
    content = f.read()

content = content.replace("    sonGuncelleme: new Date().toISOString(),", "")

with open('engine/index.ts', 'w') as f:
    f.write(content)

