import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST') {
    const { answer, timestamp } = req.body;
    await kv.set('proposal_answer', { answer, timestamp });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const data = await kv.get('proposal_answer');
    return res.status(200).json(data || { answer: null });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
