import { ProcessedEmail, EmailIntent } from '../types/JobApplication';

export const sampleEmails: ProcessedEmail[] = [
  {
    id: '1234567890',
    from: 'recruiting@stripe.com',
    subject: 'Interview scheduled - Frontend Engineer position',
    body: `Hi Athul,

Thank you for your interest in the Frontend Engineer position at Stripe. We'd like to schedule a technical interview with you.

Please let me know your availability for next week:
- Monday, July 8th at 2:00 PM PST
- Tuesday, July 9th at 10:00 AM PST
- Wednesday, July 10th at 3:00 PM PST

The interview will be conducted via Zoom and will last approximately 60 minutes. We'll cover technical questions and a coding exercise.

Looking forward to speaking with you!

Best regards,
Sarah Chen
Technical Recruiting Team
Stripe`,
    date: new Date('2025-07-02T10:30:00Z'),
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {}
    },
    processed: false
  },
  {
    id: '2345678901',
    from: 'noreply@greenhouse.io',
    subject: 'Update on your application to Meta',
    body: `Dear Athul,

Thank you for your interest in the Software Engineer position at Meta and for taking the time to interview with our team.

After careful consideration, we have decided not to move forward with your application at this time. We received many strong applications and had to make difficult decisions.

We encourage you to apply for future opportunities that match your background and interests.

Thank you again for your time and interest in Meta.

Best regards,
Meta Recruiting Team`,
    date: new Date('2025-07-01T14:15:00Z'),
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {}
    },
    processed: false
  },
  {
    id: '3456789012',
    from: 'careers@databricks.com',
    subject: 'Exciting news about your application!',
    body: `Hi Athul,

Congratulations! We are pleased to extend you an offer for the Senior Software Engineer position at Databricks.

Your interview performance was impressive and we believe you would be a great addition to our engineering team.

Offer details:
- Position: Senior Software Engineer
- Base Salary: $185,000
- Equity: Stock options
- Start Date: August 5, 2025

Please review the attached offer letter and let us know your decision by July 15th.

We're excited about the possibility of you joining our team!

Best regards,
Jennifer Lee
Talent Acquisition
Databricks`,
    date: new Date('2025-07-01T16:45:00Z'),
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {}
    },
    processed: false
  },
  {
    id: '4567890123',
    from: 'recruiting@google.com',
    subject: 'Following up on your Google interview',
    body: `Hello Athul,

Thank you for taking the time to interview with us for the Software Engineer L5 position last week.

The team was impressed with your technical skills and problem-solving approach. We'd like to invite you to the next round of interviews.

Next steps:
1. Technical deep-dive with the engineering team (90 minutes)
2. System design interview (60 minutes)
3. Culture fit interview with the hiring manager (45 minutes)

Please let me know your availability for the week of July 14-18.

Best regards,
Michael Zhang
Google Recruiting`,
    date: new Date('2025-06-30T11:20:00Z'),
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {}
    },
    processed: false
  },
  {
    id: '5678901234',
    from: 'jobs@airbnb.com',
    subject: 'Thank you for your interest in Airbnb',
    body: `Dear Athul,

Thank you for applying to the Full-Stack Engineer position at Airbnb. We appreciate the time you invested in our application process.

Unfortunately, we will not be moving forward with your candidacy for this particular role. We had an exceptional pool of candidates and difficult decisions to make.

We encourage you to keep an eye on our careers page for future opportunities that might be a better fit.

Thank you again for your interest in Airbnb.

Best,
Airbnb Talent Team`,
    date: new Date('2025-06-29T09:10:00Z'),
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {}
    },
    processed: false
  },
  {
    id: '6789012345',
    from: 'recruiting@notion.so',
    subject: 'Interview feedback and next steps - Notion',
    body: `Hi Athul,

Thank you for the great conversation during your interview with the Notion engineering team yesterday.

The team was impressed with:
- Your React and TypeScript expertise
- Creative problem-solving approach
- Understanding of collaborative tools and user experience

We'd like to proceed with a final round interview with our VP of Engineering. This will be a 45-minute conversation focused on leadership and strategic thinking.

Are you available next Thursday, July 10th at 2 PM PST?

Looking forward to the next conversation!

Best,
Alex Kim
Engineering Recruiting
Notion`,
    date: new Date('2025-06-28T15:30:00Z'),
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {}
    },
    processed: false
  }
];

export function getSampleEmailsForDryRun(): ProcessedEmail[] {
  return sampleEmails.map(email => ({
    ...email,
    // Reset processing state for fresh dry-run
    processed: false,
    classification: {
      intent: EmailIntent.UNKNOWN,
      companyName: '',
      confidence: 0,
      extractedData: {}
    }
  }));
}