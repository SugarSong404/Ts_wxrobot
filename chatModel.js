const axios = require('axios');

async function chatAi(messages,api) {
    try {
        const response = await axios.post(
            api.chat.link,
            {
                model: api.chat.model,
                messages,
                stream: false,
                temperature: 0.95,
                top_p: 0.7,
                max_tokens: 1024,
            },
            {
                headers: {
                    Authorization: `Bearer ${api.chat.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message;
        }
        return null
    } catch (error) {
        console.error("Error calling the model:", error);
        return null
    }
}

module.exports = { chatAi };
