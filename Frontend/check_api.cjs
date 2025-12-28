const axios = require('axios');
const API_KEY = '8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b';

async function checkKeys() {
    try {
        const response = await axios.get(`https://apiv3.apifootball.com/?action=get_predictions&from=2025-12-28&to=2025-12-28&APIkey=${API_KEY}`);
        if (response.data && response.data.length > 0) {
            console.log(JSON.stringify(response.data[0], null, 2));
        } else {
            console.log('No data found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkKeys();
