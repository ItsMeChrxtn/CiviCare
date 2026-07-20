const Notification = require('../models/Notification');
const { emitToUser, emitToRole } = require('../config/socket');

/**
 * Single entry point for creating a notification: persists it and pushes it
 * over Socket.IO in real time. Every controller that needs to notify a user
 * should call this instead of touching the Notification model directly.
 */
const notifyUser = async ({ recipient, type, title, message, link, relatedId }) => {
  const notification = await Notification.create({ recipient, type, title, message, link, relatedId });
  emitToUser(recipient.toString(), 'notification:new', notification);
  return notification;
};

/** Notifies every user currently connected under a given role (e.g. all officials). */
const notifyRole = async ({ recipients, role, type, title, message, link, relatedId }) => {
  const notifications = await Notification.insertMany(
    recipients.map((recipient) => ({ recipient, type, title, message, link, relatedId }))
  );
  emitToRole(role, 'notification:new', { title, message, link, type });
  return notifications;
};

module.exports = { notifyUser, notifyRole };
