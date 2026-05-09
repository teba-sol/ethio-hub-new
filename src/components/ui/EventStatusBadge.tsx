import React from 'react';
import { Badge } from './Badge';

export interface EventStatusBadgeProps {
  startDate: string | Date;
  endDate: string | Date;
  verificationStatus: string;
  className?: string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ 
  startDate, 
  endDate, 
  verificationStatus,
  className = '' 
}) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: 'Draft' | 'Pending Review' | 'Under Review' | 'Approved' | 'Live' | 'Upcoming' | 'Completed' | 'Rejected' = 'Draft';
  let variant: 'success' | 'warning' | 'error' | 'info' | 'secondary' = 'secondary';
  
  if (verificationStatus === 'Not Submitted') {
    status = 'Draft';
    variant = 'secondary';
  } else if (verificationStatus === 'Pending Review') {
    status = 'Pending Review';
    variant = 'warning';
  } else if (verificationStatus === 'Under Review') {
    status = 'Under Review';
    variant = 'info';
  } else if (verificationStatus === 'Rejected') {
    status = 'Rejected';
    variant = 'error';
  } else if (verificationStatus === 'Approved') {
    if (now > end) {
      status = 'Completed';
      variant = 'secondary';
    } else if (daysUntilStart <= 1) {
      status = 'Live';
      variant = 'success';
    } else if (daysUntilStart <= 7) {
      status = 'Upcoming';
      variant = 'info';
    } else {
      status = 'Upcoming';
      variant = 'success';
    }
  }
  
  const labels: Record<string, string> = {
    'Draft': 'Draft',
    'Pending Review': 'Pending Review',
    'Under Review': 'Under Review',
    'Approved': 'Published',
    'Live': 'Live',
    'Upcoming': 'Upcoming',
    'Completed': 'Completed',
    'Rejected': 'Rejected',
  };
  
  return (
    <Badge variant={variant} size="sm" className={className}>
      {labels[status] || status}
    </Badge>
  );
};
