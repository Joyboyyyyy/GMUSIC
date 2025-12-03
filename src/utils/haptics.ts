import * as Haptics from "expo-haptics";

export const hapticTap = () => Haptics.selectionAsync();
export const hapticSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const hapticError = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
export const hapticWarning = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

