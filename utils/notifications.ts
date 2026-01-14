import * as Notifications from 'expo-notifications';

export async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync({
        ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
        },
    });
    return status === 'granted';
}

export async function cancelEventNotifications(eventId: string) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const eventNotifications = scheduled.filter(n => n.content.data?.eventId === eventId);
    
    for (const n of eventNotifications) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
}

export async function scheduleEventNotifications(eventId: string, title: string, dateStr: string) {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const eventDate = new Date(dateStr);
    const now = new Date();

    const schedule = async (triggerDate: Date, body: string, idSuffix: string) => {
        // Ensure we are scheduling in the future
        if (triggerDate > now) {
            triggerDate.setHours(9, 0, 0, 0); // Normalize to 9 AM
            
            // Double check validation after normalization
            if (triggerDate > now) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Memories Milestone",
                        body: body,
                        data: { eventId, type: idSuffix },
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: triggerDate,
                    },
                });
            }
        }
    };

    // 1. Fixed Day Milestones (50, 100, 500, 1000)
    // Includes Countdown Logic: 3 days before, 1 day before
    const distinctDays = [50, 100, 500, 1000];

    for (const days of distinctDays) {
        let triggerDate = new Date(eventDate.getTime());
        triggerDate.setDate(triggerDate.getDate() + days);
        
        const milestoneName = `${days} days`;
        
        // Actual Milestone
        await schedule(triggerDate, `Happy ${milestoneName} since ${title}!`, `day-${days}`);

        // Countdown: 3 Days before
        let warn3 = new Date(triggerDate);
        warn3.setDate(warn3.getDate() - 3);
        await schedule(warn3, `3 days to go until ${milestoneName} of ${title}!`, `warn-3-day-${days}`);

        // Countdown: 1 Day before
        let warn1 = new Date(triggerDate);
        warn1.setDate(warn1.getDate() - 1);
        await schedule(warn1, `1 day to go until ${milestoneName} of ${title}!`, `warn-1-day-${days}`);
    }

    // 2. Yearly Anniversaries (1 to 10 Years)
    // Includes Countdown Logic
    for (let i = 1; i <= 10; i++) {
        let triggerDate = new Date(eventDate.getTime());
        triggerDate.setFullYear(triggerDate.getFullYear() + i);

        const milestoneName = `${i} Year${i > 1 ? 's' : ''}`;

        // Anniversary Notification
        await schedule(triggerDate, `Happy Anniversary! ${i} Year${i > 1 ? 's' : ''} since ${title}.`, `year-${i}`);

        // Countdown: 3 Days before
        let warn3 = new Date(triggerDate);
        warn3.setDate(warn3.getDate() - 3);
        await schedule(warn3, `3 days to go until your ${i} Year Anniversary of ${title}!`, `warn-3-year-${i}`);

        // Countdown: 1 Day before
        let warn1 = new Date(triggerDate);
        warn1.setDate(warn1.getDate() - 1);
        await schedule(warn1, `1 day to go until your ${i} Year Anniversary of ${title}!`, `warn-1-year-${i}`);
    }

    // 3. Monthly Recurring (Up to 50 Years)
    // "1 year 1 month completed", "3 months completed"
    for (let i = 1; i <= 600; i++) {
        // Skip exact years (12, 24) as they are covered by the Yearly Anniversary loop which is more special
        if (i % 12 === 0) continue;

        let triggerDate = new Date(eventDate.getTime());
        
        // Add months safely
        const targetMonth = triggerDate.getMonth() + i;
        triggerDate.setMonth(targetMonth);
        
        // Adjust for month length discrepancies (e.g. Jan 31 + 1 month -> Feb 28/29)
        // If the date accidentally rolled over to the next month (e.g. March 2nd), pull it back to last day of Feb.
        if (triggerDate.getDate() !== eventDate.getDate()) {
             // Basic fix: set to day 0 of current month (last day of previous)
             // This happens if we were Jan 31 and ended up March 3
             // We want Feb 28
             triggerDate.setDate(0); 
        }

        const years = Math.floor(i / 12);
        const months = i % 12;

        let timeStr = "";
        if (years > 0) timeStr += `${years} Year${years > 1 ? 's' : ''} `;
        if (months > 0) timeStr += `${months} Month${months > 1 ? 's' : ''} `;
        
        await schedule(triggerDate, `${timeStr.trim()} completed since ${title}.`, `month-${i}`);
    }

    // 4. Hourly Milestones
    // 100, 500, then every 1k up to 500k (~57 years)
    const hourMilestones = [100, 500];
    for (let h = 1000; h <= 500000; h += 1000) {
        hourMilestones.push(h);
    }

    for (const hours of hourMilestones) {
        let triggerDate = new Date(eventDate.getTime());
        triggerDate.setTime(triggerDate.getTime() + (hours * 60 * 60 * 1000));
        
        let label = `${hours} Hours`;
        if (hours >= 1000) {
            label = `${hours / 1000}k Hours`;
        }

        await schedule(triggerDate, `${label} passed since ${title}.`, `hours-${hours}`);
    }
}
