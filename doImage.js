const fs = require('fs');
const axios = require('axios');
const FileType = require('file-type');
const { FileBox } = require('file-box');

async function url_toFile(url, image_path) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
    });
    const writer = fs.createWriteStream(image_path);
    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', async() => {
            const fileType = await FileType.fromFile(image_path);
            if (fileType) {
                if (fileType.mime === 'image/gif')reject('读取错误：gif不是受支持的类型');
                else resolve();
            }
        });
        writer.on('error', reject);
    });
}

async function getImageRealized(message,api) {
    try{
        var image_path = `./cfg/${new Date().getTime()}.jpg`
        var imageContent = null
        if(message.payload.type===6){
            const file_box = await message.toFileBox()
            await file_box.toFile(image_path)
        }else if(message.payload.type===5){
            var url = message.payload.text.replace(/\s/g,"").replace(/&amp;amp;/g,"&").split('cdnurl=')[1].split('designerid')[0].replace(/^['"]|['"]$/g, '');
            await url_toFile(url,image_path)
        }
        imageContent = await getContent(image_path,api)
        return imageContent
    }catch(e){
        console.log(e)
        return null
    }
}

async function image_to_base64(image_path){
    return new Promise((resolve, reject) => {
        fs.readFile(image_path, (err, data) => {
            if (err) {
                reject(`Error reading file: ${err.message}`);
            } else {
                const base64 = data.toString('base64');
                try{
                    fs.unlinkSync(image_path);
                    resolve(base64);
                }catch(e){
                    reject(`Error remove file: ${e}`);
                }
            }
        });
    });
}

async function getContent(image_path,api){
    try {
        const messages=[
            {
              "role": "user",
              "content": [
                {
                  "type": "image_url",
                  "image_url": {
                      "url": await image_to_base64(image_path)
                  }
                },
                {
                  "type": "text",
                  "text": "请描述这个图片"
                }
              ]
            }
          ]
        const response = await axios.post(
            api.r_img.link,
            {
                model: api.r_img.model,
                messages,
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${api.r_img.token}`,
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

async function sendGenerateImage(prompt,api){
    try {
        const response = await axios.post(
            api.g_img.link,
            {
                model: api.g_img.model,
                prompt,
            },
            {
                headers: {
                    Authorization: `Bearer ${api.g_img.token}`,
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

async function getRandomEmoji(web){
    try{
        const file_path = './cfg/emoji.jpg'
        await url_toFile(web,file_path)
        return FileBox.fromFile(file_path)
    }catch(e){
        console.error(e)
        return null
    }
}

module.exports = {getRandomEmoji, getImageRealized,sendGenerateImage};
