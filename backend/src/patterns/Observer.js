/**
 * Observer Pattern - Approval Notification System
 * Observers are notified when approval status changes
 * Open for extension: Add new observers without modifying existing code
 */

export class Subject {
  constructor() {
    this.observers = [];
  }

  attach(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(data) {
    this.observers.forEach(observer => observer.update(data));
  }
}

export class Observer {
  update(data) {
    throw new Error('Method must be implemented by subclass');
  }
}

/**
 * Concrete Observers
 */
export class EmailNotificationObserver extends Observer {
  update(data) {
    console.log(`📧 Email notification: ${data.type} ${data.status} for ${data.itemName}`);
    // Implementation: Send email notification
    // In production: Use nodemailer or email service
  }
}

export class LogNotificationObserver extends Observer {
  update(data) {
    console.log(`📝 Log: ${new Date().toISOString()} - ${data.type} ${data.id} ${data.status}`);
    // Implementation: Log to file or logging service
  }
}

export class DatabaseNotificationObserver extends Observer {
  update(data) {
    console.log(`💾 Database: Saving notification for ${data.type} ${data.id}`);
    // Implementation: Save notification to database
  }
}

/**
 * Approval Subject - manages approval notifications
 */
export class ApprovalSubject extends Subject {
  constructor() {
    super();
    // Attach default observers
    this.attach(new EmailNotificationObserver());
    this.attach(new LogNotificationObserver());
    this.attach(new DatabaseNotificationObserver());
  }

  approvalStatusChanged(type, item, status, adminId) {
    const data = {
      type,
      id: item._id,
      itemName: item.name,
      status,
      adminId,
      timestamp: new Date(),
      guideId: item.guideId,
    };
    this.notify(data);
  }
}

// Singleton instance of ApprovalSubject
let approvalSubjectInstance = null;

export const getApprovalSubject = () => {
  if (!approvalSubjectInstance) {
    approvalSubjectInstance = new ApprovalSubject();
  }
  return approvalSubjectInstance;
};
