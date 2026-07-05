import re

with open('app/onboarding.tsx', 'r') as f:
    content = f.read()

old_badge = """              <Text style={[styles.minimalPHValue, { color: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success }]}>
                {livePHData.tahminiPH.toFixed(1)}
              </Text>"""

new_badge = """              <Text style={[styles.minimalPHValue, { color: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success }]}>
                {livePHData.tahminiPH.toFixed(1)} <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>%Math.max(0, Math.min(100, livePHData.guvenilirlik))}</Text>
              </Text>"""

# Wait, %Math.max should be {%Math.max} -> {`%${Math.max(0, Math.min(100, livePHData.guvenilirlik))}`}
new_badge2 = """              <Text style={[styles.minimalPHValue, { color: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success }]}>
                {livePHData.tahminiPH.toFixed(1)} <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>(%{Math.max(0, Math.min(100, livePHData.guvenilirlik))})</Text>
              </Text>"""

content = content.replace(old_badge, new_badge2)

with open('app/onboarding.tsx', 'w') as f:
    f.write(content)

