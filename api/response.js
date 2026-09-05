module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = 'https://polished-marten-120532.upstash.io';
  const token = 'gQAAAAAAAdbUAAIgcDEyOWY2OThhNWFiNDA0MGE0OGRmNWQwYzg5NWEyYjlmNA';

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      
      if (body.reset) {
        await fetch(`${url}/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['DEL', 'proposal_history'])
        });
        await fetch(`${url}/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['DEL', 'visitor_ip'])
        });
        return res.status(200).json({ success: true, reset: true });
      }

      if (body.type === 'ip') {
        const ipData = {
          ip: body.ip,
          timestamp: new Date().toLocaleTimeString()
        };
        await fetch(`${url}/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['SET', 'visitor_ip', JSON.stringify(ipData)])
        });
        return res.status(200).json({ success: true, ipInfo: ipData });
      }

      const getRes = await fetch(`${url}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['GET', 'proposal_history'])
      });
      const getData = await getRes.json();
      let history = [];
      if (getData && getData.result) {
        try { history = JSON.parse(getData.result); } catch (e) {}
      }

      const newEntry = {
        id: history.length + 1,
        answer: body.answer,
        timestamp: body.timestamp || new Date().toLocaleString()
      };
      history.push(newEntry);

      await fetch(`${url}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'proposal_history', JSON.stringify(history)])
      });

      return res.status(200).json({ success: true, history });
    }

    if (req.method === 'GET') {
      const [histRes, ipRes] = await Promise.all([
        fetch(`${url}/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['GET', 'proposal_history'])
        }),
        fetch(`${url}/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['GET', 'visitor_ip'])
        })
      ]);

      const histData = await histRes.json();
      const ipData = await ipRes.json();

      let history = [];
      if (histData && histData.result) {
        try { history = JSON.parse(histData.result); } catch (e) {}
      }

      let ipInfo = null;
      if (ipData && ipData.result) {
        try { ipInfo = JSON.parse(ipData.result); } catch (e) {}
      }

      return res.status(200).json({ history, ipInfo });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
