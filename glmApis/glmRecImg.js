const axios = require('axios'); 

async function glmRecognizeImage(inputImage ,authentication){
    try {
        const messages=[
            {
              "role": "user",
              "content": [
                {
                  "type": "image_url",
                  "image_url": {
                      "url": inputImage
                  }
                },
                {
                  "type": "text",
                  "text": "请描述这个图片,你的回答一定要以“这是一张xxx的图片开始”"
                }
              ]
            }
          ]
        const response = await axios.post(
          authentication.recimg.link,
            {
                model: authentication.recimg.model,
                messages,
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${authentication.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content;
        }
        return null
    } catch (error) {
        console.error("Error calling the model:", error);
        return null
    }
}

module.exports = glmRecognizeImage;