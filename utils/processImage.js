const axios = require('axios');
const FileType = require('file-type');
const { FileBox } = require('file-box');

async function url_toBuffer(url) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        let data = [];
        response.data.on('data', (chunk) => {
            data.push(chunk);
        });
        response.data.on('end', async () => {
            const buffer = Buffer.concat(data);
            const fileType = await FileType.fromBuffer(buffer);
            if (fileType) {
                if (fileType.mime === 'image/gif') {
                    reject('读取错误：gif不是受支持的类型');
                } else {
                    resolve(buffer);
                }
            } else {
                reject('无法确定文件类型');
            }
        });
        response.data.on('error', reject);
    });
}

async function filebox_toBuffer(fileBox) {
  try {
    const buffer = await fileBox.toBuffer(); 
    const fileType = await FileType.fromBuffer(buffer);
    if (fileType) {
      if (fileType.mime === 'image/gif') {
        throw new Error('读取错误：gif不是受支持的类型');
      } else {
        return buffer;
      }
    } else {
      throw new Error('无法确定文件类型');
    }
  } catch (error) {
    console.log('处理 FileBox 发生错误:', error);
    throw error;
  }
}

async function urlToFileBox(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const fileType = await FileType.fromBuffer(buffer);
    if (fileType) {
      if (fileType.mime === 'image/gif') {
        throw new Error('不支持 GIF 文件');
      }
    } else {
      throw new Error('无法确定文件类型'); 
    }

    const fileBox = FileBox.fromBuffer(buffer, 'unknown.jpg');
    return fileBox;

  } catch (error) {
    console.log('URL 转 FileBox 发生错误:', error);
    throw error;
  }
}

module.exports = { url_toBuffer ,filebox_toBuffer ,urlToFileBox };
