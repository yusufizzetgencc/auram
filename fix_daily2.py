import re

with open('services/dailyRecommendation.ts', 'r') as f:
    content = f.read()

old_code = "safePreferences.kullanimAmaci.some(amaci => parfum.kullanimAmaci.includes(amaci)) if Array.isArray(safePreferences.kullanimAmaci) else parfum.kullanimAmaci.includes(safePreferences.kullanimAmaci as any)"
new_code = "(Array.isArray(safePreferences.kullanimAmaci) ? safePreferences.kullanimAmaci.some(amaci => parfum.kullanimAmaci.includes(amaci)) : parfum.kullanimAmaci.includes(safePreferences.kullanimAmaci as any))"

content = content.replace(old_code, new_code)

with open('services/dailyRecommendation.ts', 'w') as f:
    f.write(content)

