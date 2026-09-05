export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Detects both Vercel KV and default Upstash Environment Variable names
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'Redis environment variables missing in Vercel' });
  }

  try {
    // 1. SAVE ANSWER (POST)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const answer = body.answer || 'YES';
      const timestamp = body.timestamp || new Date().toLocaleString();

      const payload = JSON.stringify({ answer, timestamp });

      const upstashRes = await fetch(`${url}/set/proposal_answer/${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!upstashRes.ok) {
        const errText = await upstashRes.text();
        return res.status(500).json({ error: 'Failed to write to Redis', details: errText });
      }

      return res.status(200).json({ success: true, answer, timestamp });
    }

    // 2. READ ANSWER (GET)
    if (req.method === 'GET') {
      const upstashRes = await fetch(`${url}/get/proposal_answer`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!upstashRes.ok) {
        return res.status(200).json({ answer: null, timestamp: null });
      }

      const data = await upstashRes.json();

      if (data && data.result) {
        try {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          return res.status(200).json(parsed);
        } catch (e) {
          return res.status(200).json({ answer: data.result, timestamp: null });
        }
      }

      return res.status(200).json({ answer: null, timestamp: null });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'Serverless error', details: err.message });
  }
}
