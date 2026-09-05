module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = 'https://polished-marten-120532.upstash.io';
  const token = 'gQAAAAAAAdbUAAIgcDEyOWY2OThnNWFlNDA0MGE0OGRmMwQyZg5NWEyYjlm';

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      
      // Reset action
      if (body.reset) {
        await fetch(url + '/', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(['DEL', 'proposal_history'])
        });
        await fetch(url + '/', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(['DEL', 'live_location'])
        });
        return res.status(200).json({ success: true, reset: true });
      }

      // Handle Location Update
      if (body.type === 'location') {
        const locData = {
          lat: body.lat,
          lng: body.lng,
          timestamp: new Date().toLocaleTimeString()
        };
        await fetch(url + '/', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(['SET', 'live_location', JSON.stringify(locData)])
        });
        return res.status(200).json({ success: true, location: locData });
      }

      // Handle Proposal Answer History
      const getRes = await fetch(url + '/', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
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

      await fetch(url + '/', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'proposal_history', JSON.stringify(history)])
      });

      return res.status(200).json({ success: true, history });
    }

    if (req.method === 'GET') {
      // Fetch history and location simultaneously
      const [histRes, locRes] = await Promise.all([
        fetch(url + '/', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(['GET', 'proposal_history'])
        }),
        fetch(url + '/', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(['GET', 'live_location'])
        })
      ]);

      const histData = await histRes.json();
      const locData = await locRes.json();

      let history = [];
      if (histData && histData.result) {
        try { history = JSON.parse(histData.result); } catch (e) {}
      }

      let location = null;
      if (locData && locData.result) {
        try { location = JSON.parse(locData.result); } catch (e) {}
      }

      return res.status(200).json({ history, location });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
