import re

with open('app/gift.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { hesaplaPHPure, hesaplaParfumPHSkoruPure, buildTemporaryProfile } from '@/engine';", "import { hesaplaPHPure, hesaplaParfumPHSkoruPure, buildTemporaryProfile } from '@/engine';\nimport { hapticLight, hapticMedium } from '@/utils/haptics';")

# 2. handleNext
content = content.replace("  const handleNext = () => {\n    if (step === 'recipient') setStep('occasion');", "  const handleNext = () => {\n    hapticMedium();\n    if (step === 'recipient') setStep('occasion');")
content = content.replace("else if (step === 'budget') {\n      setStep('results');\n    }", "else if (step === 'budget') {\n      hapticMedium();\n      setStep('results');\n    }")

# 3. handleBack
content = content.replace("  const handleBack = () => {\n    if (step === 'occasion') setStep('recipient');", "  const handleBack = () => {\n    hapticLight();\n    if (step === 'occasion') setStep('recipient');")

with open('app/gift.tsx', 'w') as f:
    f.write(content)

