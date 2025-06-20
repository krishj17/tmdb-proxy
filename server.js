const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const TMDB_API_KEY = 'ec0384aa0ba089f7d3bbb0c12e53de7d';

app.get('/api/latest', async (req, res) => {
    console.log('Received request to /api/latest');
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    console.error(error.response?.data || error.message);
    res.status(500).send('Failed to fetch data from TMDB');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
