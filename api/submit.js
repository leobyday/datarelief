export default async function handler(req, res) {
  if (req.method === 'POST') {
    const data = req.body;

    if (!data.organization || !data.email || !data.items || !data.crisisName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      submittedBy: data.organization,
      submitterEmail: data.email,
      submitterPhone: data.phone || null,
      crisisName: data.crisisName,
      crisisId: data.crisisId || null,
      itemsNeeded: data.items,
      donationInstructions: data.donationInstructions || null,
      notes: data.notes || null,
      status: 'pending'
    };

    console.log('[submit] New submission:', JSON.stringify(submission));

    if (process.env.DISCORD_WEBHOOK_URL) {
      const itemsList = submission.itemsNeeded
        .map(i => `• ${i.name} (${i.qty} ${i.unit}) — **${i.priority}**`)
        .join('\n');

      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '📝 New Crisis Data Submission',
            color: 0x0066cc,
            fields: [
              { name: 'Organization', value: submission.submittedBy, inline: true },
              { name: 'Crisis', value: submission.crisisName, inline: true },
              { name: 'Contact', value: submission.submitterEmail, inline: true },
              { name: 'Items Needed', value: itemsList || 'None listed' },
              { name: 'Notes', value: submission.notes || 'None' },
              { name: 'Submission ID', value: submission.id }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      }).catch(err => console.error('[submit] Discord notify failed:', err));
    }

    return res.status(200).json({
      success: true,
      message: 'Submission received. We will review and respond within 24 hours.',
      submissionId: submission.id
    });
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Submission ID required' });

    return res.status(200).json({
      id,
      status: 'pending',
      message: 'Your submission is being reviewed. You will receive an email within 24 hours.'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
