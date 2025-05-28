// server/utils/scheduler.js
import mongoose from 'mongoose';
import TechStack from '../models/TechStack.js';
import User from '../models/User.js';
import { sendMail } from './emailService.js';
import { generateDailyTaskReminderEmail } from './emailTemplates.js';
import Notification from '../models/Notification.js';

export const runDailyTaskReminderScheduler = async (io, activeUsers) => {
  console.log('🗓️ Running Daily Task Reminder Scheduler...');
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const techStacksWithScheduledItems = await TechStack.find({
      'roadmapItems.scheduledDate': {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).lean();

    if (techStacksWithScheduledItems.length === 0) {
      console.log('Scheduler: No tasks scheduled for today.');
      return;
    }

    for (const techStack of techStacksWithScheduledItems) {
      const itemsDueToday = techStack.roadmapItems.filter(item => {
        if (!item.scheduledDate) return false;
        const itemScheduledDate = new Date(item.scheduledDate);
        return itemScheduledDate >= startOfDay && itemScheduledDate <= endOfDay;
      });

      if (itemsDueToday.length === 0) continue;

      const assignedInstructors = await User.find({
        role: 'instructor',
        assignedTechStacks: techStack._id,
        isActive: true,
      }).lean();

      if (assignedInstructors.length === 0) continue;

      for (const item of itemsDueToday) {
        for (const instructor of assignedInstructors) {
          const existingNotification = await Notification.findOne({
            recipient: instructor._id,
            type: 'scheduled_task_reminder',
            'details.roadmapItemId': item._id.toString(),
            'details.techStackId': techStack._id.toString(),
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          });

          if (existingNotification) {
            console.log(`Scheduler: Reminder already sent for item "${item.topic}" to instructor ${instructor.username} today.`);
            continue;
          }

          const notificationData = {
            recipient: instructor._id,
            triggeredBy: instructor._id, // Self-reminder for scheduled task
            type: 'scheduled_task_reminder',
            message: `Task Reminder: "${item.topic}" in Tech Stack "${techStack.name}" is scheduled for today.`,
            link: `/timeline?techStackId=${techStack._id}&itemId=${item._id}`,
            resourceId: techStack._id,
            resourceModel: 'TechStack',
            details: {
              roadmapItemId: item._id.toString(),
              roadmapItemTopic: item.topic,
              techStackName: techStack.name,
              scheduledDate: item.scheduledDate.toISOString().split('T')[0],
              subTopics: item.subTopics?.map(st => st.name).join(', ') || 'N/A',
              projects: item.projects?.map(p => p.name).join(', ') || 'N/A',
            }
          };

          const savedNotification = await Notification.create(notificationData);
          // Populate for emitting, especially if client expects full user objects
          const notificationToSend = await Notification.findById(savedNotification._id)
                                          .populate('triggeredBy', 'username firstName lastName role')
                                          .populate('recipient', 'username firstName lastName role') // Useful if this notif also goes to a manager
                                          .lean();
          
          console.log(`Scheduler: Created reminder for item "${item.topic}" for instructor ${instructor.username}`);

          const recipientSocketId = activeUsers.get(instructor._id.toString());
          if (recipientSocketId && io) {
            io.to(recipientSocketId).emit('new_notification', notificationToSend);
            console.log(`📨 Emitted 'new_notification' (task reminder) to user ${instructor._id} (socket ${recipientSocketId})`);
          } else {
            console.log(`ℹ️ User ${instructor._id} not currently connected for real-time task reminder.`);
          }
        }
      }
    }
    console.log('✅ Daily Task Reminder Scheduler finished.');
  } catch (error) {
    console.error('❌ Error in Daily Task Reminder Scheduler:', error);
  }
};

export const runDailyEmailTaskReminderScheduler = async () => {
  console.log('📧 Running Daily EMAIL Task Reminder Scheduler...');
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

  try {
    const today = new Date();
    // Ensure comparison is with dates, not datetime
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const techStacksWithScheduledItems = await TechStack.find({
      'roadmapItems.scheduledDate': {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).lean();

    if (techStacksWithScheduledItems.length === 0) {
      console.log('Email Scheduler: No tech stacks with items scheduled for today.');
      return;
    }

    const instructorsWithTasks = new Map(); // Map: instructorId -> { instructorInfo, tasks: [] }

    for (const techStack of techStacksWithScheduledItems) {
      const itemsDueToday = techStack.roadmapItems.filter(item => {
        if (!item.scheduledDate) return false;
        const itemScheduledDate = new Date(item.scheduledDate);
        return itemScheduledDate >= startOfDay && itemScheduledDate <= endOfDay;
      });

      if (itemsDueToday.length === 0) continue;

      const assignedInstructors = await User.find({
        role: 'instructor',
        assignedTechStacks: techStack._id,
        isActive: true,
        'emailPreferences.reminders.dailyTasks.enabled': true, // Check preference
        email: { $ne: null, $ne: "" } // Ensure email exists
      }).select('email firstName lastName username emailPreferences').lean();

      if (assignedInstructors.length === 0) continue;

      for (const instructor of assignedInstructors) {
        if (!instructorsWithTasks.has(instructor._id.toString())) {
          instructorsWithTasks.set(instructor._id.toString(), {
            instructorInfo: instructor,
            tasks: [],
          });
        }

        const instructorEntry = instructorsWithTasks.get(instructor._id.toString());
        itemsDueToday.forEach(item => {
          // Avoid duplicate tasks if an instructor is assigned to multiple tech stacks
          // with the same item (unlikely but good check)
          if (!instructorEntry.tasks.some(t => t.itemId.toString() === item._id.toString())) {
            instructorEntry.tasks.push({
              techStackId: techStack._id.toString(),
              techStackName: techStack.name,
              itemId: item._id.toString(),
              topic: item.topic,
              subTopics: item.subTopics,
              projects: item.projects,
              scheduledDate: item.scheduledDate,
            });
          }
        });
      }
    }

    if (instructorsWithTasks.size === 0) {
        console.log('Email Scheduler: No instructors (with preferences enabled) have tasks due today.');
        return;
    }

    for (const [_instructorId, data] of instructorsWithTasks.entries()) {
      if (data.tasks.length > 0 && data.instructorInfo.email) {
        const instructorName = `${data.instructorInfo.firstName || ''} ${data.instructorInfo.lastName || ''}`.trim() || data.instructorInfo.username;
        const emailSubject = `Daily Reminder: You have ${data.tasks.length} scheduled task(s) today`;
        const emailHtmlContent = generateDailyTaskReminderEmail(instructorName, data.tasks, CLIENT_URL);
        await sendMail(data.instructorInfo.email, emailSubject, emailHtmlContent);
      }
    }
    console.log('✅ Daily EMAIL Task Reminder Scheduler finished.');
  } catch (error) {
    console.error('❌ Error in Daily EMAIL Task Reminder Scheduler:', error);
  }
};