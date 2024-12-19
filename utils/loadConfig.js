const fs = require('fs');
const yaml = require('js-yaml');

const schema = {
    piggy: {
        type: ["array"],
        items: {
            chat: { type: ["string"], validate: (v) => v.trim() !== "" },
            status: { type: ["boolean"], default: true },
            prompt: { type: ["string"], default: "", validate: (v) => v.trim() !== "" },
            freq: { type: ["number"], default: 0.3, validate: (v) => v >= 0 && v <= 1 },
            emjFreq: { type: ["number"], default: 0, validate: (v) => v >= 0 && v <= 1 },
            recOn: { type: ["boolean"], default: false },
            genOn: { type: ["boolean"], default: false },
        },
    },
};

function validateConfig(config, schema, path = "") {
    if (typeof schema !== "object" || schema === null) {
        throw new Error(`模式定义错误：模式必须是对象，当前为 ${typeof schema}`);
    }

    Object.entries(schema).forEach(([key, rules]) => {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in config)) {
            if ('default' in rules) {
                config[key] = rules.default; 
            } else if (!rules.optional) { 
                throw new Error(`配置文件格式错误：缺少必需字段 ${currentPath}`);
            }
            return;
        }

        const value = config[key];
        const type = Array.isArray(value) ? "array" : typeof value;

        if (!rules.type.includes(type)) {
            throw new Error(`配置文件格式错误：${currentPath} 应为 ${rules.type.join("/")}，当前为 ${type}`);
        }


        if (rules.type.includes("array") && Array.isArray(value)) {
            value.forEach((item, index) => {
                validateConfig(item, rules.items, `${currentPath}[${index}]`);
            });
        } else if (rules.validate && !rules.validate(value)) {
            throw new Error(`配置文件格式错误：${currentPath} 不满足验证条件`);
        }
    });
}


function loadYamlConfig(resolvedPath) {
    try {
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`config.yml 不存在，请检查路径`);
        }
        const configContent = fs.readFileSync(resolvedPath, "utf-8");
        const config = yaml.load(configContent);

        validateConfig(config, schema);

        config.piggy.forEach((item) => {
            item.messages = [];
        });

        console.log(`⭐配置读取成功，含有${config.piggy.length}条对话域设置\n`)

        return config.piggy;

    } catch (error) {
        throw new Error(`配置文件读取失败：${error.message}`);
    }
}

module.exports = loadYamlConfig;
