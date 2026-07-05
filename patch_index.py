import re

with open('app/(tabs)/index.tsx', 'r') as f:
    content = f.read()

# The hero section to insert
hero_section = """          {/* Daily Hero Recommendation */}
          {!todaySotd && dailyRecs.length > 0 && (
            <Animated.View entering={FadeInUp.delay(30).duration(400)}>
              <LinearGradient
                colors={['#8A2387', '#E94057', '#F27121']}
                style={styles.dailyCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.dailyHeader}>
                  <View style={styles.dailyBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFF" />
                    <Text style={styles.dailyBadgeText}>
                      {weatherRec ? 'Hava Durumuna Göre Seçildi' : '✨ Bugün İçin Seçtik'}
                    </Text>
                  </View>
                  <View style={styles.dailyScore}>
                    <Text style={styles.dailyScoreText}>%{dailyRecs[0].matchPercentage} Uyum</Text>
                  </View>
                </View>

                <Text style={styles.dailyName}>{dailyRecs[0].parfum.isim}</Text>
                <Text style={styles.dailyBrand}>{dailyRecs[0].parfum.marka || 'Auram'}</Text>

                <View style={styles.dailyReasons}>
                  {dailyRecs[0].reasons.slice(0, 2).map((reason, index) => (
                    <View key={index} style={styles.dailyReason}>
                      <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.dailyReasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
                  <Pressable 
                    style={styles.dailyAction} 
                    onPress={() => handleOpenParfum(dailyRecs[0].parfum)}
                  >
                    <Text style={styles.dailyActionText}>Detayına Git</Text>
                    <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
                  </Pressable>

                  <Pressable 
                    style={[styles.dailyAction, { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }]} 
                    onPress={() => {
                      selectTodaysSotd(dailyRecs[0].parfum.id, weather);
                      confettiRef.current?.fire();
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={[styles.dailyActionText, { color: '#FFF', fontWeight: 'bold' }]}>Bugün Bunu Sıktım</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* SOTD Hub */}"""

content = content.replace("          {/* SOTD Hub */}", hero_section)

with open('app/(tabs)/index.tsx', 'w') as f:
    f.write(content)

