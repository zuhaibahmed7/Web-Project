// Sample complaints raised by customers (FR-RR-05, UC-12/UC-13).
// Admin can move an issue through open -> in_review -> resolved | dismissed.

import { isoFromToday } from '../utils/date';

export const COMPLAINT_STATUSES = {
  open: { label: 'Open', color: '#EF4444', tone: 'bg-rejected/12 text-rejected ring-rejected/30 dark:text-[#ff8a8a]' },
  in_review: { label: 'In review', color: '#F5B301', tone: 'bg-pending/12 text-[#8a6500] ring-pending/30 dark:text-glow-300' },
  resolved: { label: 'Resolved', color: '#10B981', tone: 'bg-completed/12 text-completed ring-completed/30 dark:text-[#4ade9f]' },
  dismissed: { label: 'Dismissed', color: '#94A3B8', tone: 'bg-cancelled/20 text-slate-600 ring-cancelled/40 dark:text-slate-300' },
};

const at = (daysAgo) => `${isoFromToday(-daysAgo)}T09:30:00.000Z`;

export const SEED_COMPLAINTS = [
  {
    id: 'cp-01',
    code: 'CM-118',
    complainantId: 'u-customer',
    providerId: 'p-12',
    bookingId: 'bk-12',
    subject: 'Provider rejected after confirming on the phone',
    details:
      'FrostCare agreed to travel to Karachi over the phone and then rejected the request the next morning without any message. I lost a full day of planning.',
    status: 'open',
    createdAt: at(5),
    updatedAt: at(5),
    resolution: '',
    priority: 'high',
  },
  {
    id: 'cp-02',
    code: 'CM-117',
    complainantId: 'u-customer-2',
    providerId: 'p-25',
    bookingId: null,
    subject: 'Final bill much higher than the quoted price',
    details:
      'Garage Express quoted PKR 4,200 for the cooling system repair on the app but charged PKR 7,800 on site. The extra was never mentioned.',
    status: 'in_review',
    createdAt: at(9),
    updatedAt: at(4),
    resolution: '',
    priority: 'high',
  },
  {
    id: 'cp-03',
    code: 'CM-115',
    complainantId: 'u-customer-3',
    providerId: 'p-16',
    bookingId: null,
    subject: 'Cleaner did not show up for the booked slot',
    details:
      'Booked a 4 pm slot with ShineWorks. Nobody arrived and calls were not answered until 7 pm, when the visit was cancelled.',
    status: 'resolved',
    createdAt: at(18),
    updatedAt: at(12),
    resolution:
      'Provider issued an apology and the booking was removed from their record. Availability rules re-explained to the provider.',
    priority: 'medium',
  },
  {
    id: 'cp-04',
    code: 'CM-113',
    complainantId: 'u-customer',
    providerId: 'p-19',
    bookingId: null,
    subject: 'Paint colour different from the sample',
    details:
      'WallArt Coatings used a shade noticeably darker than the card I approved. They say it is the same tin, but the hallway does not match the bedroom.',
    status: 'in_review',
    createdAt: at(14),
    updatedAt: at(7),
    resolution: '',
    priority: 'medium',
  },
  {
    id: 'cp-05',
    code: 'CM-112',
    complainantId: 'u-customer-4',
    providerId: 'p-08',
    bookingId: null,
    subject: 'Duplicate booking created from one request',
    details:
      'I submitted one request to PowerHouse but two bookings appear in my list. Please delete the extra one.',
    status: 'open',
    createdAt: at(3),
    updatedAt: at(3),
    resolution: '',
    priority: 'low',
  },
  {
    id: 'cp-06',
    code: 'CM-109',
    complainantId: 'u-customer-2',
    providerId: 'p-04',
    bookingId: null,
    subject: 'Provider documents look incomplete',
    details:
      'Drain Masters FSD listed only a CNIC photo and no trade certificate, yet shows as available for sewer suction work.',
    status: 'dismissed',
    createdAt: at(27),
    updatedAt: at(20),
    resolution:
      'Checked against the verification queue: the provider is still marked pending and is not publicly listed, so no action was required.',
    priority: 'low',
  },
  {
    id: 'cp-07',
    code: 'CM-120',
    complainantId: 'u-customer-3',
    providerId: 'p-05',
    bookingId: 'bk-09',
    subject: 'Work started later than the agreed time',
    details:
      'The wiring job started close to two hours after the booked slot. The quality is fine but the delay was not communicated.',
    status: 'open',
    createdAt: at(1),
    updatedAt: at(1),
    resolution: '',
    priority: 'medium',
  },
];
