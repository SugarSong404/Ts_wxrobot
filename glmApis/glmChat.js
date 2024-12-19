const axios = require('axios'); 

async function glmModelChat(input ,authentication) {
    try {
        const response = await axios.post(
            authentication.chat.link,
            {
                model: authentication.chat.model,
                messages: input,
                stream: false,
                temperature: 0.95,
                top_p: 0.7,
                max_tokens: 1024,
            },
            {
                headers: {
                    Authorization: `Bearer ${authentication.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        if (response.data && response.data.choices && response.data.choices.length > 0)
            return response.data.choices[0].message.content;
        return null
    } catch (error) {
        console.error("Error calling the model:", error);
        return null
    }
}

module.exports = glmModelChat;
