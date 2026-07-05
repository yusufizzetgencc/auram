import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const hapticLight = async () => {
  if (Platform.OS === 'web') return;
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
};

export const hapticMedium = async () => {
  if (Platform.OS === 'web') return;
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
};

export const hapticSuccess = async () => {
  if (Platform.OS === 'web') return;
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
};

export const hapticSelection = async () => {
  if (Platform.OS === 'web') return;
  try { await Haptics.selectionAsync(); } catch (e) {}
};
