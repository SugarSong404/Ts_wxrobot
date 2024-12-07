const axios = require('axios');

const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEFAULT_MODEL = "glm-4-plus";
const API_KEY = "692f672288e239ff771021ca6a36da89.XWjoA5LWnwgxbw04";

async function chatAi(messages) {
    try {
        const response = await axios.post(
            API_URL,
            {
                model: DEFAULT_MODEL,
                messages,
                stream: false,
                temperature: 0.95,
                top_p: 0.7,
                max_tokens: 1024,
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
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
