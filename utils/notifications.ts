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
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const eventNotifications = scheduled.filter(n => n.content.data?.eventId === eventId);
        
        if (eventNotifications.length > 0) {
            await Promise.all(eventNotifications.map(n => 
                Notifications.cancelScheduledNotificationAsync(n.identifier)
            ));
            console.log(`[Notifications] Cancelled ${eventNotifications.length} notifications for event ${eventId}`);
        }
    } catch (error) {
        console.warn("[Notifications] Failed to cancel notifications:", error);
        // Don't throw, so we don't block the delete/update process
    }
}

export async function scheduleEventNotifications(eventId: string, title: string, dateStr: string, isTimeCapsule: boolean = false) {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Check notification permissions again just to be safe
    // Cancel any existing notifications for this event first to avoid duplicates
    await cancelEventNotifications(eventId);

    const eventDate = new Date(dateStr);
    const now = new Date();

    // Helper to format numbers (1000 -> 1k, 1500 -> 1.5k)
    const formatNumber = (num: number) => {
        if (num >= 1000) {
            const k = num / 1000;
            return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
        }
        return num.toString();
    };

    // Store all potential notifications in memory first
    // This allows us to calculate "Lifetime" coverage but only schedule what the OS allows (next ~60)
    interface NotificationCandidate {
        triggerDate: Date;
        title: string;
        body: string;
        idSuffix: string;
    }
    const candidates: NotificationCandidate[] = [];

    const addCandidate = (triggerDate: Date, notifTitle: string, body: string, idSuffix: string, prioritizeMorning: boolean = false) => {
        const d = new Date(triggerDate);
        if (prioritizeMorning) {
            d.setHours(9, 0, 0, 0);
        }
        // Only add if it's in the future
        if (d > now) {
            candidates.push({
               triggerDate: d,
               title: notifTitle,
               body,
               idSuffix
            });
        }
    };

    // 0. Time Capsule Unlocking (Specific Event)
    if (isTimeCapsule) {
        addCandidate(
            eventDate,
            "🔐 Time Capsule Unlocked!",
            `✨ The time has come! Your time capsule "${title}" is now open. Tap to view! 🔓`,
            "capsule-open",
            false // Exact time
        );
    }

    // 1. Minutes
    // 100, 500, then every 500 starting from 1000
    // Lifetime: 100 Years = ~52,560,000 minutes
    // We can iterate this efficiently in JS
    const minuteMilestones = [100, 500];
    const MINUTE_LIMIT = 52560000; // ~100 years
    for (let m = 1000; m <= MINUTE_LIMIT; m += 500) {
        minuteMilestones.push(m);
    }
    for (const mins of minuteMilestones) {
        // Optimization: Check if this specific milestone is already past before creating Date object? 
        // JS creates objects fast, but let's be safe.
        // eventDate + mins * 60000 > now
        // mins * 60000 > now - eventDate
        // This check is implicitly done in addCandidate but doing it here might save Date allocs.
        // For simplicity and robustness, currently just running the loop is fine for 100k items.
        
        const trigger = new Date(eventDate.getTime() + mins * 60000);
        const label = formatNumber(mins);
        addCandidate(
            trigger, 
            `✨ ${title}`,
            `⏳ ${label} Minutes passed! Time to celebrate! 🎉`, 
            `mins-${mins}`, 
            false
        );
    }

    // 2. Hours
    // 10, 50, 100, 500, then every 500
    // Lifetime: 100 Years = ~876,000 hours
    const hourMilestones = [10, 50, 100, 500];
    const HOUR_LIMIT = 876000; 
    for (let h = 1000; h <= HOUR_LIMIT; h += 500) {
        hourMilestones.push(h);
    }
    for (const hours of hourMilestones) {
        const trigger = new Date(eventDate.getTime() + hours * 3600000);
        const label = formatNumber(hours);
        addCandidate(
            trigger,
            `✨ ${title}`,
            `⚡ ${label} Hours passed! Time to celebrate! 🚀`, 
            `hours-${hours}`, 
            false
        );
    }

    // 3. Days
    // 1, 7, 50, 100, 500, then every 1000
    // Lifetime: 100 Years = ~36,500 days
    const dayMilestones = [1, 2, 3, 4, 5, 6, 7, 50, 100, 500];
    for (let d = 1000; d <= 36500; d += 1000) {
        dayMilestones.push(d);
    }
    for (const days of dayMilestones) {
        const trigger = new Date(eventDate);
        trigger.setDate(trigger.getDate() + days);
        const label = formatNumber(days);
        const suffix = days === 1 ? 'Day' : 'Days';
        addCandidate(
            trigger,
            `✨ ${title}`,
            `🗓️ ${label} ${suffix} passed! Time to celebrate! 🥂`, 
            `days-${days}`, 
            true
        );
    }

    // 4. Months & Years
    // Lifetime: 100 Years = 1200 months
    for (let i = 1; i <= 1200; i++) {
        const trigger = new Date(eventDate);
        const targetMonth = trigger.getMonth() + i;
        trigger.setMonth(targetMonth);
        if (trigger.getDate() !== eventDate.getDate()) {
            trigger.setDate(0); 
        }

        const years = Math.floor(i / 12);
        const months = i % 12;

        let label = "";
        if (months === 0) {
            label = `${years} Year${years > 1 ? 's' : ''} complete`;
        } else {
            const yStr = years > 0 ? `${years} Year${years > 1 ? 's' : ''} ` : "";
            const mStr = `${months} Month${months > 1 ? 's' : ''}`;
            label = `${yStr}${mStr} passed`;
        }

        addCandidate(
            trigger,
            `✨ ${title}`,
            `🏆 ${label}! Time to celebrate! 🎂`, 
            `month-${i}`, 
            true
        );
    }

    // SORT candidates by Date (Ascending)
    candidates.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());

    // TAKE the first 60 (System Limit Safeguard)
    // Most devices limit to 64. We use 60 to be safe and leave room for other apps/notifications.
    const notificationsToSchedule = candidates.slice(0, 60);

    // SCHEDULE them
    for (const item of notificationsToSchedule) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: item.title,
                body: item.body,
                data: { eventId, type: item.idSuffix },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: item.triggerDate,
            },
        });
    }
}
