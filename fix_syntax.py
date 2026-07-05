with open('app/onboarding.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "const styles = StyleSheet.create({" in line:
        pass # Keep it
    new_lines.append(line)

with open('app/onboarding.tsx', 'w') as f:
    f.write(''.join(new_lines))

