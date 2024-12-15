const fs = require('fs');
const yaml = require('js-yaml');

function getCFG() {
    try {
        const resolvedPath = "./cfg/config.yml"
        if(!fs.existsSync(resolvedPath)) throw Error(`config.yml不存在，请检查路径`)
        const configContent = fs.readFileSync(resolvedPath, 'utf-8');
        const config = yaml.load(configContent);

        if (!config.wxrobot) {
            throw new Error("配置文件格式错误：缺少 wxrobot 字段！");
        }

        if (!config.wxrobot.api) {
            throw new Error("配置文件格式错误：缺少 wxrobot.api 字段！");
        }

        if (typeof config.wxrobot.api.token !== 'string' || config.wxrobot.api.token.trim() === "") {
            throw new Error("配置文件格式错误：wxrobot.api.token 必须是非空字符串！");
        }

        if (typeof config.wxrobot.api.model !== 'string' || config.wxrobot.api.model.trim() === "") {
            throw new Error("配置文件格式错误：wxrobot.api.model 必须是非空字符串！");
        }

        if (!Array.isArray(config.wxrobot.list)) {
            throw new Error("配置文件格式错误：wxrobot.list 必须是一个数组！");
        }
        
        config.wxrobot.list.forEach((item, index) => {
            if (typeof item.chat !== 'string' || item.chat.trim() === "") {
                throw new Error(`配置文件格式错误：wxrobot 第 ${index + 1} 项的 chat 必须是非空字符串！`);
            }
            if (typeof item.status !== 'boolean') {
                throw new Error(`配置文件格式错误：wxrobot 第 ${index + 1} 项的 status 必须是布尔值！`);
            }
            if (typeof item.prompt !== 'string' || item.prompt.trim() === "") {
                throw new Error(`配置文件格式错误：wxrobot 第 ${index + 1} 项的 prompt 必须是非空字符串！`);
            }
            if (typeof item.freq !== 'number' || item.freq < 0 || item.freq > 1) {
                throw new Error(`配置文件格式错误：wxrobot 第 ${index + 1} 项的 freq 必须是[0,1]范围内的数字！`);
            }
            item.messages = [];
        });

        return config.wxrobot;
    } catch (error) {
        throw new Error(`配置文件读取失败：${error.message}`);
    }
}

module.exports = { getCFG };
