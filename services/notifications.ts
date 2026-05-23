/**
 * AROMIXEN - Notifications Service
 * Akıllı yerel (local) bildirim yönetimi
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationPreferences } from '@/types';

// Bildirim davranışını ayarla (uygulama açıkken bile göstersin)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Bildirim izni iste
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

/**
 * Günlük sabah ritüeli bildirimini planla
 */
export async function scheduleMorningRoutine(prefs: NotificationPreferences) {
  if (!prefs.enabled || !prefs.weatherSuggestions) return;

  // Önce eski sabah bildirimlerini iptal et
  await cancelNotificationsById('morning_routine');

  // Varsayılan sabah 08:00
  let hour = 8;
  let minute = 0;
  
  if (prefs.reminderTime) {
    const parts = prefs.reminderTime.split(':');
    if (parts.length === 2) {
      hour = parseInt(parts[0], 10);
      minute = parseInt(parts[1], 10);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Günaydın! ☀️",
      body: "Günün parfümünü seçtin mi? Dolabındaki sana özel önerilere göz at.",
      data: { type: 'weather_suggestion' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    identifier: 'morning_routine',
  });
}

/**
 * Akşam performans değerlendirmesi bildirimini planla (SOTD seçildiğinde çağrılır)
 */
export async function scheduleEveningPerformanceLog(parfumName: string) {
  await cancelNotificationsById('evening_performance');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Günün Nasıl Geçti? 🌙",
      body: `Bugün ${parfumName} sıktın. Kalıcılığı nasıldı? İltifat aldın mı? Hadi kaydet!`,
      data: { type: 'mood_check' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
    identifier: 'evening_performance',
  });
}

/**
 * Hafta sonu bildirimini planla
 */
export async function scheduleWeekendVibe(prefs: NotificationPreferences) {
  if (!prefs.enabled || !prefs.discoveryTips) return;

  await cancelNotificationsById('weekend_vibe');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Hafta Sonu Planları? 🥂",
      body: "Bu gece çekiciliğini artıracak, imzan olacak o parfümü seç.",
      data: { type: 'discovery' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, // 1: Sun, 2: Mon, ..., 6: Fri
      hour: 18,
      minute: 0,
    },
    identifier: 'weekend_vibe',
  });
}

/**
 * SOTD Streak tehlikesi (Inactivity) - Eğer 3 gün girmezse
 */
export async function scheduleStreakWarning(prefs: NotificationPreferences) {
  if (!prefs.enabled) return;

  await cancelNotificationsById('streak_warning');

  // 3 gün sonrasına kur. Eğer SOTD yaparsa bu iptal edilip tekrar 3 gün sonraya kurulur
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 3);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Serin Tehlikede! 🔥",
      body: "3 gündür parfümünü seçmedin. Rutine dönme zamanı geldi!",
      data: { type: 'usage_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
    identifier: 'streak_warning',
  });
}

/**
 * Tüm akıllı rutin bildirimlerini günceller
 */
export async function updateAllScheduledNotifications(prefs: NotificationPreferences) {
  if (!prefs.enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  await scheduleMorningRoutine(prefs);
  await scheduleWeekendVibe(prefs);
  await scheduleStreakWarning(prefs);
}

async function cancelNotificationsById(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    // Ignore error if it doesn't exist
  }
}
