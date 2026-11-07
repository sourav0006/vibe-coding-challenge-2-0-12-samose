/**
 * One Academy — Centralized Contact & Support Configuration
 *
 * All verified public contact channels, operating hours, and support schedules are defined here.
 */

export const OFFICIAL_EMAILS = [
  "souravn0612@gmail.com",
  "alokrai0327@gmail.com",
] as const;

export const OFFICIAL_PHONES = [
  "+91 7480926552",
  "+91 9025712162",
] as const;

export const OPERATING_HOURS = {
  academy: {
    title: "Academy Operating Hours",
    schedule: "Monday to Sunday: 7:00 AM – 8:00 PM IST",
    description: "Open daily for roster training, practice sessions, and scheduled competitive fixtures.",
  },
  support: {
    title: "Contact & Support Availability",
    schedule: "Monday to Saturday: 9:00 AM – 6:00 PM IST",
    sundayNote: "Sunday: Support is unavailable, while the academy remains open for scheduled training and fixtures.",
    description: "Assistance with account activation, portal access, technical queries, and data records.",
  },
} as const;

export interface SupportChannel {
  title: string;
  category: string;
  emails: readonly string[];
  phones: readonly string[];
  description: string;
  availability: string;
}

export const SUPPORT_CONFIG = {
  academyName: "One Academy",
  systemSubtitle: "Single-Academy Sports Management System",
  lastUpdated: "November 2026",

  officialEmails: OFFICIAL_EMAILS,
  officialPhones: OFFICIAL_PHONES,
  operatingHours: OPERATING_HOURS,

  // 1. General Enquiries
  generalEnquiries: {
    title: "General Enquiries",
    category: "General Information",
    emails: OFFICIAL_EMAILS,
    phones: OFFICIAL_PHONES,
    description: "Questions regarding sports schedules, academy fixtures, admissions, and athlete participation policies.",
    availability: "Monday – Saturday: 9:00 AM – 6:00 PM IST (Sunday closed for support)",
  },

  // 2. Technical Support
  technicalSupport: {
    title: "Technical Support",
    category: "System & Software",
    emails: OFFICIAL_EMAILS,
    phones: OFFICIAL_PHONES,
    description: "Assistance with platform errors, session timeouts, or browser compatibility questions.",
    availability: "Monday – Saturday: 9:00 AM – 6:00 PM IST (Sunday closed for support)",
  },

  // 3. Account Activation Assistance
  activationHelp: {
    title: "Account Activation Assistance",
    category: "Code & Roster Verification",
    emails: OFFICIAL_EMAILS,
    phones: OFFICIAL_PHONES,
    description: "Assistance with 8-character single-use activation codes issued to Players and Scouts by the Coach.",
    availability: "Monday – Saturday: 9:00 AM – 6:00 PM IST (Sunday closed for support)",
  },

  // 4. Account Access & Login Problems
  accountAccess: {
    title: "Account Access & Login Support",
    category: "Authentication",
    emails: OFFICIAL_EMAILS,
    phones: OFFICIAL_PHONES,
    description: "Guidance on portal role tab selection, 2-minute cooldown unlocks, or account access problems.",
    availability: "Monday – Saturday: 9:00 AM – 6:00 PM IST (Sunday closed for support)",
  },

  // 5. Privacy-Related Requests
  privacyRequests: {
    title: "Privacy & Data Records",
    category: "Data Protection",
    emails: OFFICIAL_EMAILS,
    phones: OFFICIAL_PHONES,
    description: "Requests for inspection, correction, or deletion of personal profile data and historical training records.",
    availability: "Monday – Saturday: 9:00 AM – 6:00 PM IST (Sunday closed for support)",
  },

  // 6. Academy Administration Contact
  academyAdministration: {
    title: "Academy Administration",
    category: "Head Office",
    emails: OFFICIAL_EMAILS,
    phones: OFFICIAL_PHONES,
    description: "Official administrative management for One Academy operations, fixture sanctioning, and scout credentials.",
    availability: "Academy Hours: Monday to Sunday: 7:00 AM – 8:00 PM IST · Support: Monday to Saturday: 9:00 AM – 6:00 PM IST",
  },
} as const;
