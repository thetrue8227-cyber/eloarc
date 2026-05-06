const axios = require('axios');

async function getCloudEval(fen, multiPv = 3) {
  try {
    const response = await axios.get('https://lichess.org/api/cloud-eval', {
      params: { fen, multiPv },
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw new Error('Lichess eval unavailable');
  }
}

module.exports = { getCloudEval };
