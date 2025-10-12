import { BookingRepository } from '../patterns/Repository.js';

const bookingRepo = new BookingRepository();

/**
 * Create booking (User only)
 */
export const createBooking = async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      userId: req.user._id,
      status: 'pending',
      paymentStatus: 'pending',
    };

    const booking = await bookingRepo.create(bookingData);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

/**
 * Get user's bookings
 */
export const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const result = await bookingRepo.findAll(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req, res) => {
  try {
    const booking = await bookingRepo.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (req.user.role === 'user' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get booking',
      error: error.message,
    });
  }
};

/**
 * Update booking
 */
export const updateBooking = async (req, res) => {
  try {
    const booking = await bookingRepo.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (req.user.role === 'user' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own bookings',
      });
    }

    // Users can't update confirmed bookings
    if (req.user.role === 'user' && booking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update confirmed booking',
      });
    }

    const updatedBooking = await bookingRepo.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message,
    });
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingRepo.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (req.user.role === 'user' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking',
      });
    }

    const updatedBooking = await bookingRepo.update(req.params.id, {
      status: 'cancelled',
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

/**
 * Get all bookings (Admin only)
 */
export const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const result = await bookingRepo.findAll(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: ['userId'],
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
};
