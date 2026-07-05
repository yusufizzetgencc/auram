import re

with open('app/results.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { getPHAraligi, hesaplaParfumPHSkoruPure } from '@/engine';", "import { getPHAraligi, hesaplaParfumPHSkoruPure } from '@/engine';\nimport { hapticLight } from '@/utils/haptics';")

# 2. openParfumDetail
content = content.replace("  const openParfumDetail = (result: RecommendationResult) => {\n    setSelectedParfum(result);", "  const openParfumDetail = (result: RecommendationResult) => {\n    hapticLight();\n    setSelectedParfum(result);")

with open('app/results.tsx', 'w') as f:
    f.write(content)

