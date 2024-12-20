const fs = require('fs');
const yaml = require('js-yaml');

function loadGlmAuthen(filePath){
  try {
    const configContent = fs.readFileSync(filePath, 'utf-8');
    const config = yaml.load(configContent);

    console.log("⭐[内置默认glm模块]认证配置读取成功")
    console.log(`对话模型${config.authen.chat.model}，图片识别模型${config.authen.recimg.model}，文生图模型${config.authen.genimg.model}\n`)

    return config.authen;
  } catch (error) {
    console.error('读取glm认证文件失败:', error);
    return null; 
  }
}

module.exports = loadGlmAuthen