export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (req.method === 'POST') {
    const { answer, timestamp } = req.body;
    
    await fetch(`${url}/set/proposal_answer`, {
      headers: { Authorization: `Bearer ${token}` },
      method: 'POST',
      body: JSON.stringify({ answer, timestamp })
    });

    return res.status(200).json({ success: true, answer });
  }

  if (req.method === 'GET') {
    const response = await fetch(`${url}/get/proposal_answer`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    let result = { answer: null, timestamp: null };

    if (data.result) {
      try {
        result = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      } catch (e) {
        result = { answer: null, timestamp: null };
      }
    }

    return res.status(200).json(result);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
