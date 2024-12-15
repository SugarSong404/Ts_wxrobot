const axios = require('axios');

const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

async function chatAi(messages,api) {
    try {
        const response = await axios.post(
            API_URL,
            {
                model: api.model,
                messages,
                stream: false,
                temperature: 0.95,
                top_p: 0.7,
                max_tokens: 1024,
            },
            {
                headers: {
                    Authorization: `Bearer ${api.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message;
        }
        throw new Error("Invalid response from the API");
    } catch (error) {
        console.error("Error calling the model:", error);
        throw error;
    }
}

module.exports = { chatAi };
