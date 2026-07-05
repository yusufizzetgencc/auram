import re

with open('app/onboarding.tsx', 'r') as f:
    content = f.read()

# Using regex to remove the first occurrence of `  content: {\n    flex: 1,\n    paddingHorizontal: Spacing.lg,\n  },`
old_content = "  content: {\n    flex: 1,\n    paddingHorizontal: Spacing.lg,\n  },"
content = content.replace(old_content, "", 1)

with open('app/onboarding.tsx', 'w') as f:
    f.write(content)

