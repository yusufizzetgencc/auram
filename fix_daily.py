import re

with open('services/dailyRecommendation.ts', 'r') as f:
    content = f.read()

old_code = "parfum.kullanimAmaci.includes(safePreferences.kullanimAmaci)"
new_code = "safePreferences.kullanimAmaci.some(amaci => parfum.kullanimAmaci.includes(amaci)) if Array.isArray(safePreferences.kullanimAmaci) else parfum.kullanimAmaci.includes(safePreferences.kullanimAmaci as any)"

content = content.replace(old_code, new_code)

with open('services/dailyRecommendation.ts', 'w') as f:
    f.write(content)

