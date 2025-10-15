export const ensureGuideApproved = (req, res) => {
  if (!req?.user || req.user.role !== 'guide') {
    return true;
  }

  const status = req.user.guideInfo?.verificationStatus;

  if (status === 'approved') {
    return true;
  }

  res.status(403).json({
    success: false,
    message: 'Guide account requires admin approval before performing this action.',
    status,
  });
  return false;
};
