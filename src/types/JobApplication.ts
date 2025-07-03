export interface JobApplication {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  appliedDate: string | null;
  status: JobStatus;
  statusDate: string;
  archived: boolean;
  dateArchived: string | null;
  notes: string;
}

export enum JobStatus {
  SAVED = 'SAVED',
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEWING = 'INTERVIEWING',
  REJECTED = 'REJECTED',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED'
}

export interface EmailClassification {
  intent: EmailIntent;
  companyName: string;
  confidence: number;
  extractedData: {
    jobTitle?: string;
    interviewDate?: string;
    statusChange?: JobStatus;
    actionRequired?: string;
  };
}

export enum EmailIntent {
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_REMINDER = 'INTERVIEW_REMINDER',
  FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED',
  REJECTION = 'REJECTION',
  OFFER = 'OFFER',
  GENERAL_UPDATE = 'GENERAL_UPDATE',
  UNKNOWN = 'UNKNOWN'
}

export interface ProcessedEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
  classification: EmailClassification;
  processed: boolean;
}