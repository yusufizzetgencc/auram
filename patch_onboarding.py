import re

with open('app/onboarding.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("    TouchableOpacity,\n    View,\n} from 'react-native';", "    TouchableOpacity,\n    View,\n    Pressable,\n} from 'react-native';\nimport { hapticLight, hapticMedium } from '@/utils/haptics';")

# 2. State
content = content.replace("const [phInput, setPHInput] = useState('');", "const [phInput, setPHInput] = useState('');\n  const [showPHTooltip, setShowPHTooltip] = useState(false);")

# 3. Handlers
content = content.replace("const handleSingleSelect = (value: string) => {", "const handleSingleSelect = (value: string) => {\n    hapticLight();")
content = content.replace("const handleMultiSelect = (value: string) => {\n    toggleArrayPreference", "const handleMultiSelect = (value: string) => {\n    hapticLight();\n    toggleArrayPreference")

# 4. Next handler
content = content.replace("const handleNext = () => {\n    if (currentStep < visibleSteps.length - 1) {", "const handleNext = () => {\n    hapticMedium();\n    if (currentStep < visibleSteps.length - 1) {")

# 5. Header JSX
old_header = """      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        {currentStep > 0 && (
          <TouchableOpacity 
            onPress={handleBack} 
            style={[styles.backButton, { backgroundColor: colors.card }, shadows.sm]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.tint} />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.tint,
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentStep + 1} / {visibleSteps.length}
          </Text>
        </View>

        {/* Canlı pH Göstergesi */}
        <View style={[styles.livePHContainer, { backgroundColor: colors.card, borderColor: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success }]}>
          <Text style={[styles.livePHLabel, { color: colors.textSecondary }]}>pH</Text>
          <Text style={[styles.livePHValue, { color: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success }]}>
            {livePHData.tahminiPH.toFixed(1)} <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>(%{Math.max(0, Math.min(100, livePHData.guvenilirlik))})</Text>
          </Text>
        </View>
      </View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        {/* Kategori Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(currentStepData.kategori) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(currentStepData.kategori) }]}>
            {currentStepData.kategori}
          </Text>
        </View>

        {/* Title */}"""

new_header = """      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + Spacing.sm }]}>
        
        {/* Top Row: Back Button, Step Indicator, pH Badge */}
        <View style={styles.headerTopRow}>
          {/* Back Button Placeholder or Button */}
          {currentStep > 0 ? (
            <TouchableOpacity 
              onPress={handleBack} 
              style={[styles.backButton, { backgroundColor: colors.card }, shadows.sm]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.tint} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}

          {/* Center Indicator */}
          <View style={styles.centerIndicator}>
            <Text style={[styles.centerIndicatorText, { color: getCategoryColor(currentStepData.kategori) }]}>
              {currentStepData.kategori} <Text style={{ color: colors.textSecondary }}>· {currentStep + 1}/{visibleSteps.length}</Text>
            </Text>
          </View>

          {/* Minimal pH Badge */}
          <View style={{ position: 'relative', zIndex: 10 }}>
            <Pressable 
              onPress={() => setShowPHTooltip(!showPHTooltip)}
              style={[styles.minimalPHBadge, { 
                backgroundColor: colors.card, 
                borderColor: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success 
              }]}
            >
              <Text style={[styles.minimalPHLabel, { color: colors.textSecondary }]}>pH</Text>
              <Text style={[styles.minimalPHValue, { color: livePHData.tahminiPH < 5 ? colors.error : livePHData.tahminiPH > 6 ? colors.primary : colors.success }]}>
                {livePHData.tahminiPH.toFixed(1)}
              </Text>
            </Pressable>

            {/* Tooltip Overlay */}
            {showPHTooltip && (
              <View style={[styles.phTooltip, { backgroundColor: colors.card, borderColor: colors.border }, shadows.md]}>
                <View style={[styles.phTooltipArrow, { borderBottomColor: colors.card }]} />
                <Text style={[styles.phTooltipTitle, { color: colors.text }]}>pH Güvenilirliği: %{Math.max(0, Math.min(100, livePHData.guvenilirlik))}</Text>
                <Text style={[styles.phTooltipDesc, { color: colors.textSecondary }]}>
                  {livePHData.aciklama || 'Seçimlerinize göre tahmini cilt pH değeriniz.'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Row: Progress Bar */}
        <View style={[styles.progressBarFull, { backgroundColor: colors.border }]}>
          <Animated.View 
            style={[
              styles.progressFillFull, 
              { 
                backgroundColor: colors.tint,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]} 
          />
        </View>
      </View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        {/* Title */}"""

content = content.replace(old_header, new_header)

# 6. Styles
old_styles = """  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  livePHContainer: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
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
  livePHLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  livePHValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },"""

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

content = content.replace(old_styles, new_styles)

with open('app/onboarding.tsx', 'w') as f:
    f.write(content)

