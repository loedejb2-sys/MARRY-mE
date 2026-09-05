export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Grab credentials from whichever set is active
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ 
      error: 'Environment variables missing', 
      hasUrl: !!url, 
      hasToken: !!token 
    });
  }

  // Clean URL to prevent double slashes
  const baseUrl = url.replace(/\/$/, '');

  try {
    // --- 1. POST: SAVE ANSWER ---
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const answer = body.answer || 'YES';
      const timestamp = body.timestamp || new Date().toLocaleString();
      const valToStore = JSON.stringify({ answer, timestamp });

      // Send as Upstash REST command array: ["SET", "proposal_answer", value]
      const upstashRes = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'proposal_answer', valToStore])
      });

      const upstashData = await upstashRes.json();

      if (!upstashRes.ok || upstashData.error) {
        return res.status(500).json({ error: 'Redis write error', details: upstashData });
      }

      return res.status(200).json({ success: true, answer, timestamp });
    }

    // --- 2. GET: FETCH ANSWER ---
    if (req.method === 'GET') {
      // Send as Upstash REST command array: ["GET", "proposal_answer"]
      const upstashRes = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'proposal_answer'])
      });

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
    return res.status(500).json({ error: 'Serverless execution error', message: err.message });
  }
}
