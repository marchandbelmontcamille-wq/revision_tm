import * as Notifications from 'expo-notifications';
import { getTasksUpcoming, getCampaigns } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  try {
    const campaigns = await getCampaigns();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    for (const campaign of activeCampaigns) {
      const tasks = await getTasksUpcoming(campaign.id);

      for (const task of tasks) {
        const taskDate = new Date(task.start + 'T08:00:00');
        const now = new Date();

        if (taskDate <= now) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Bus ${task.num_parc} — ${task.action}`,
            body: `${task.bus} | ${task.days}j | ${task.replacement}`,
            data: { campaignId: campaign.id, taskIndex: task.index },
          },
          trigger: { date: taskDate },
        });
      }
    }
  } catch (e) {
    // Silently fail if API unreachable
  }
}
