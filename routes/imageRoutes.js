const express = require('express');
const axios = require('axios');
const router = express.Router();
const { setCache, getCache, deleteCache } = require('../utilities/cacheUtility');

const API_KEY = process.env.RAPIDAPI_KEY;

router.post('/generate-image', async (req, res) => {
    const userPrompt = req.body.prompt.trim();  // Trim whitespace

    // Always clear the cache for the given prompt before generating a new image
    await deleteCache(userPrompt);

    const encodedParams = new URLSearchParams();
    encodedParams.set('text', userPrompt);

    const options = {
        method: 'POST',
        url: 'https://open-ai21.p.rapidapi.com/texttoimage2',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': API_KEY,
            'X-RapidAPI-Host': 'open-ai21.p.rapidapi.com'
        },
        data: encodedParams // Directly set to encodedParams
    };

    try {
        const response = await axios.request(options);
        console.log("Image generation API response:", response.data);

        if (response.data && response.data.status === "processing") {
            // Start polling the provided URL
            let imageUrl = await pollForImage(response.data.url);
            res.json({ imageUrl: imageUrl });
            
        } else {
            console.error("Unexpected response status:", response.data.status);
            res.status(500).json({ error: 'Unexpected response from the image generation API' });
        }
    } catch (error) {
        console.error('Error generating image:', error.message);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

async function pollForImage(url) {
    let retries = 20; // Increase the number of times to retry
    let delay = 2000; // Delay between retries in milliseconds

    while (retries > 0) {
        let response = await axios.get(url);
        if (response.data && response.data.Status !== "Processing") {
            return url; // Image is ready
        }
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait for the specified delay
        retries--;
    }

    throw new Error("Image generation timed out");
}

router.post('/clear-cache', (req, res) => {
    const prompt = req.body.prompt;
    deleteCache(prompt);
    res.json({ message: 'Cache cleared' });
});

router.post('/extract-image', (req, res) => {
    const s = req.body.data;
    const pattern = /https:\/\/[^\s\[\]]+\.png/;
    const match = s.match(pattern);
    if (match) {
        res.json({ url: match[0] });
    } else {
        res.json({ error: 'No image URL found.' });
    }
});

module.exports = router;
