const fs = require('fs');
const yaml = require('js-yaml');

const schema = {
    wxrobot: {
        type: ["object"],
        properties: {
            login:{ type: ["string"], validate: (v) => v.trim() !== "" },
            api: {
                type: ["object"],
                properties: {
                    chat: {
                        type: ["object"],
                        properties: {
                            link: { type: ["string"], validate: (v) => v.trim() !== "" },
                            token: { type: ["string"], validate: (v) => v.trim() !== "" },
                            model: { type: ["string"], validate: (v) => v.trim() !== "" },
                        },
                    },
                    r_img: {
                        type: ["object"],
                        properties: {
                            use: { type: ["boolean"] },
                            link: { type: ["string"], validate: (v) => v.trim() !== "" },
                            token: { type: ["string"], validate: (v) => v.trim() !== "" },
                            model: { type: ["string"], validate: (v) => v.trim() !== "" },
                        },
                    },
                    g_img: {
                        type: ["object"],
                        properties: {
                            use: { type: ["boolean"] },
                            link: { type: ["string"], validate: (v) => v.trim() !== "" },
                            token: { type: ["string"], validate: (v) => v.trim() !== "" },
                            model: { type: ["string"], validate: (v) => v.trim() !== "" },
                        },
                    },
                },
            },
            list: {
                type: ["array"],
                items: {
                    chat: { type: ["string"], validate: (v) => v.trim() !== "" },
                    status: { type: ["boolean"] },
                    prompt: { type: ["string"], validate: (v) => v.trim() !== "" },
                    freq: {
                        type: ["number"],
                        validate: (v) => v >= 0 && v <= 1,
                    },
                },
            },
            emoji: {
                type: ["object"],
                properties: {
                    freq: { type: ["number"],
                            validate: (v) => v >= 0 && v <= 1,
                        },
                    web: { type: ["string"], validate: (v) => v.trim() !== "" },
                },
            },
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
            if (!rules.optional) {
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
            value.forEach(item =>{
                validateConfig(item, rules.items, `${currentPath}.items`)
            }
            );
        } else if (rules.type.includes("object") && typeof value === "object") {
            validateConfig(value, rules.properties, currentPath);
        } else if (rules.validate && !rules.validate(value)) {
            throw new Error(`配置文件格式错误：${currentPath} 不满足验证条件`);
        }
    });
}

function getCFG() {
    try {
        const resolvedPath = "./cfg/config.yml";
        if (!fs.existsSync(resolvedPath))
            throw Error(`config.yml 不存在，请检查路径`);
        const configContent = fs.readFileSync(resolvedPath, "utf-8");
        const config = yaml.load(configContent);

        validateConfig(config, schema);

        config.wxrobot.list.forEach((item) => {
            item.messages = []; 
        });

        return config.wxrobot;
    } catch (error) {
        throw new Error(`配置文件读取失败：${error.message}`);
    }
}

module.exports = { getCFG };
