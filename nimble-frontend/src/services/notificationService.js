import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Configure how alerts appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 2. Initialize and request permissions
export const initNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// 3. Trigger alert and save to persistent storage
export const sendLocalAlert = async (title, body) => {
  try {
    // A. Trigger the actual system popup (Banner)
    await Notifications.scheduleNotificationAsync({
      content: { 
        title: title, 
        body: body, 
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means show immediately
    });

    // B. Save to Local History for the NotificationScreen UI
    const existingData = await AsyncStorage.getItem('nimble_notifications');
    const history = existingData ? JSON.parse(existingData) : [];
    
    const newNotif = {
      id: Date.now().toString(),
      title,
      body,
      time: new Date().toISOString(),
      unread: true
    };

    // We put the new notification at the top of the array
    await AsyncStorage.setItem('nimble_notifications', JSON.stringify([newNotif, ...history]));
    
  } catch (e) {
    console.error("Notification Service Error:", e);
  }
};