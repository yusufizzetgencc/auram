import re

with open('app/onboarding.tsx', 'r') as f:
    content = f.read()

new_styles = """  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  minimalPHBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  minimalPHLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  minimalPHValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  phTooltip: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 12,
    width: 220,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  phTooltipArrow: {
    position: 'absolute',
    top: -8,
    right: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  phTooltipTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  phTooltipDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  progressBarFull: {
    height: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressFillFull: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },"""

content = content.replace("const styles = StyleSheet.create({\n  container: {", "const styles = StyleSheet.create({\n  container: {\n    flex: 1,\n  },\n" + new_styles)

with open('app/onboarding.tsx', 'w') as f:
    f.write(content)

