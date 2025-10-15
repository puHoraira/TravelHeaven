import { getApprovalSubject } from '../patterns/Observer.js';

/**
 * ApprovalService - centralizes approval logic for resources
 * Responsibilities:
 * - Validate and perform approval/rejection through repositories
 * - Notify observers about approval status changes
 * - Keep admin controller thin and open for extension
 */
class ApprovalService {
  constructor() {
    this.approvalSubject = getApprovalSubject();
  }

  /**
   * Approve an item using its repository
   * repository: instance of a repository (must implement findById and update)
   */
  async approveItem(repository, type, id, adminId, comments = '') {
    const item = await repository.findById(id);
    if (!item) {
      const err = new Error(`${type} not found`);
      err.code = 404;
      throw err;
    }

    if (item.approvalStatus === 'approved') {
      const err = new Error(`${type} is already approved`);
      err.code = 400;
      throw err;
    }

    const updated = await repository.update(id, {
      approvalStatus: 'approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      approvalComments: comments,
    });

    // Notify observers
    try {
      this.approvalSubject.approvalStatusChanged(type, updated, 'approved', adminId);
    } catch (notifyErr) {
      // Observers failing shouldn't block the main flow
      console.error('Approval notification failed', notifyErr);
    }

    return updated;
  }

  /**
   * Reject an item using its repository
   */
  async rejectItem(repository, type, id, adminId, reason) {
    if (!reason) {
      const err = new Error('Rejection reason is required');
      err.code = 400;
      throw err;
    }

    const item = await repository.findById(id);
    if (!item) {
      const err = new Error(`${type} not found`);
      err.code = 404;
      throw err;
    }

    const updated = await repository.update(id, {
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    // Notify observers
    try {
      this.approvalSubject.approvalStatusChanged(type, updated, 'rejected', adminId);
    } catch (notifyErr) {
      console.error('Approval notification failed', notifyErr);
    }

    return updated;
  }
}

export const approvalService = new ApprovalService();
