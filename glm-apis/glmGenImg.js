const axios = require('axios'); 

async function glmGenerateImage(inputDescription ,authentication){
    try {
        const response = await axios.post(
            authentication.genimg.link,
            {
                model: authentication.genimg.model,
                prompt: inputDescription,
            },
            {
                headers: {
                    Authorization: `Bearer ${authentication.token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        var datablock = response.data
        if (datablock.data && datablock.data.length > 0 && datablock.data[0].url) {
            return datablock.data[0].url
        }
        else return null
    } catch (error) {
        console.error("Error calling the model:", error);
        return null
    }
}

module.exports = glmGenerateImage;