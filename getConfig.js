const fs = require('fs');
const path = require('path');

function getCFG() {
    const configPath = path.resolve(__dirname, 'config.json');

    if (!fs.existsSync(configPath)) {
        throw new Error("配置文件 config.json 不存在！");
    }

    try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        if (!Array.isArray(config.wxList)) {
            throw new Error("配置文件格式错误：wxList 必须是一个数组！");
        }

        config.wxList.forEach((item, index) => {
            if (typeof item.chat !== 'string' || item.chat.trim() === "") {
                throw new Error(`配置文件格式错误：wxList 第 ${index + 1} 项的 chat 必须是非空字符串！`);
            }
            if (typeof item.status !== 'boolean') {
                throw new Error(`配置文件格式错误：wxList 第 ${index + 1} 项的 status 必须是布尔值！`);
            }
            if (typeof item.prompt !== 'string' || item.prompt.trim() === "") {
                throw new Error(`配置文件格式错误：wxList 第 ${index + 1} 项的 prompt 必须是非空字符串！`);
            }
            if (!Array.isArray(item.messages)) {
                throw new Error(`配置文件格式错误：wxList 第 ${index + 1} 项的 messages 必须是一个数组！`);
            }
        });

        return config.wxList;
    } catch (error) {
        throw new Error(`配置文件读取失败：${error.message}`);
    }
}

module.exports = { getCFG };
