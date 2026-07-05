import { NextRequest, NextResponse } from 'next/server';

/**
 * API: /api/submit
 * 
 * Handles crisis data submissions from:
 * - Web form at /submit.html
 * - External API calls
 * - Government agencies
 * 
 * Stores submissions and sends notifications
 */

interface SubmissionItem {
  item: string;
  quantity: number;
  unit: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
}

interface CrisisSubmission {
  id: string;
  date: string;
  submittedBy: string;
  submitterEmail: string;
  submitterPhone?: string;
  crisisName: string;
  crisisId?: string;
  itemsNeeded: SubmissionItem[];
  donationInstructions?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.organization || !data.email || !data.items || !data.crisisName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create submission object
    const submission: CrisisSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      submittedBy: data.organization,
      submitterEmail: data.email,
      submitterPhone: data.phone,
      crisisName: data.crisisName,
      crisisId: data.crisisId,
      itemsNeeded: data.items,
      donationInstructions: data.donationInstructions,
      notes: data.notes,
      status: 'pending'
    };

    // Option 1: Send to Discord (instant notification)
    if (process.env.DISCORD_WEBHOOK_URL) {
      await notifyDiscord(submission);
    }

    // Option 2: Send to email (for backup)
    if (process.env.ADMIN_EMAIL) {
      await notifyEmail(submission);
    }

    // Option 3: Save to persistent storage
    await saveSubmission(submission);

    return NextResponse.json({
      success: true,
      message: 'Submission received. We will review and respond within 24 hours.',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}

async function notifyDiscord(submission: CrisisSubmission) {
  const itemsList = submission.itemsNeeded
    .map(item => `• ${item.item} (${item.quantity} ${item.unit}) - **${item.priority}**`)
    .join('\n');

  const embed = {
    title: '📝 New Crisis Data Submission',
    color: 0x0099ff,
    fields: [
      { name: 'Organization', value: submission.submittedBy },
      { name: 'Email', value: submission.submitterEmail },
      { name: 'Crisis', value: submission.crisisName },
      { name: 'Items Needed', value: itemsList },
      { name: 'Instructions', value: submission.donationInstructions || 'None' },
      { name: 'Submission ID', value: submission.id }
    ],
    timestamp: new Date().toISOString()
  };

  await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });
}

async function notifyEmail(submission: CrisisSubmission) {
  const itemsList = submission.itemsNeeded
    .map(item => `- ${item.item} (${item.quantity} ${item.unit}) [${item.priority}]`)
    .join('\n');

  const emailBody = `
New Crisis Data Submission

Organization: ${submission.submittedBy}
Contact: ${submission.submitterEmail}
${submission.submitterPhone ? `Phone: ${submission.submitterPhone}` : ''}

Crisis: ${submission.crisisName}

Items Needed:
${itemsList}

Instructions: ${submission.donationInstructions || 'None provided'}

Notes: ${submission.notes || 'None provided'}

---
Submission ID: ${submission.id}
Review at: https://datarelief.org/admin/submissions/${submission.id}
`;

  // Use your email service (SendGrid, Mailgun, etc.)
  // For now, just log it
  console.log('Email notification would be sent to:', process.env.ADMIN_EMAIL);
  console.log(emailBody);
}

async function saveSubmission(submission: CrisisSubmission) {
  // Option 1: Save to Vercel KV (persistent storage)
  // if (process.env.KV_REST_API_URL) {
  //   await fetch(`${process.env.KV_REST_API_URL}/set/${submission.id}`, {
  //     method: 'POST',
  //     body: JSON.stringify(submission)
  //   });
  // }

  // Option 2: Save to Firebase
  // await fetch(`https://firestore.googleapis.com/...`, {
  //   method: 'POST',
  //   body: JSON.stringify(submission)
  // });

  // Option 3: Save to GitHub (commit to repo)
  // This is simplest for now - new submissions create a PR

  // For MVP: Just notify via Discord + log
  console.log('Submission saved:', submission.id);
}

/**
 * GET: Retrieve submission status
 */
export async function GET(request: NextRequest) {
  const submissionId = request.nextUrl.searchParams.get('id');

  if (!submissionId) {
    return NextResponse.json(
      { error: 'Submission ID required' },
      { status: 400 }
    );
  }

  // Fetch from storage
  // For MVP, just return pending status
  return NextResponse.json({
    id: submissionId,
    status: 'pending',
    message: 'Your submission is being reviewed. You will receive an email within 24 hours.'
  });
}
