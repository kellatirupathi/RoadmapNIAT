// server/utils/emailTemplates.js

export const generateDailyTaskReminderEmail = (instructorName, tasks, clientUrl) => {
    const tasksHtml = tasks.map(task => `
      <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eeeeee;">
        <h3 style="margin-top: 0; margin-bottom: 8px; color: #333333; font-size: 18px;">Topic: ${task.topic}</h3>
        ${task.subTopics && task.subTopics.length > 0 ? `<p style="margin: 5px 0; color: #555555; font-size: 14px;"><strong>Subtopics:</strong> ${task.subTopics.map(st => st.name).join(', ')}</p>` : ''}
        ${task.projects && task.projects.length > 0 ? `<p style="margin: 5px 0; color: #555555; font-size: 14px;"><strong>Projects:</strong> ${task.projects.map(p => p.name).join(', ')}</p>` : ''}
        <p style="margin: 5px 0; color: #555555; font-size: 14px;"><strong>Scheduled Date:</strong> ${new Date(task.scheduledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        <p style="margin-top: 10px;"><a href="${clientUrl}/timeline?techStackId=${task.techStackId}&itemId=${task.itemId}" style="background-color: #007bff; color: white; padding: 8px 15px; text-decoration: none; border-radius: 5px; font-size: 14px;">View Task</a></p>
      </div>
    `).join('');
  
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Task Reminder</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 0; background-color: #f4f7f6; }
          .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.07); }
          .email-header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }
          .email-header h1 { margin: 0; color: #2c3e50; font-size: 24px; }
          .email-content { padding: 25px 0; }
          .email-content p { line-height: 1.65; color: #34495e; font-size: 16px; margin-bottom: 15px; }
          .email-footer { text-align: center; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 0.9em; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Daily Task Reminder</h1>
          </div>
          <div class="email-content">
            <p>Hi ${instructorName || 'Instructor'},</p>
            <p>Here are your scheduled tech stack tasks for today:</p>
            ${tasksHtml}
            <p>Please review them and update their status as needed in the application.</p>
          </div>
          <div class="email-footer">
            <p>Thanks,<br>The NIAT Roadmaps Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };