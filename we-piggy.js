const { WechatyBuilder}  = require('wechaty');
const { FileBox } = require('file-box');
const { url_toBuffer ,filebox_toBuffer ,urlToFileBox} = require('./utils/processImage');
const loadYamlConfig = require("./utils/loadConfig")
const loadGlmAuthen = require("./glmApis/glmAuthen")
const glmModelChat = require('./glmApis/glmChat');
const glmRecognizeImage = require('./glmApis/glmRecImg');
const glmGenerateImage = require('./glmApis/glmGenImg');
const qr2url = require('qrcode');

/* thank you for using we-piggy
 * @author tangsong404
 * @email 3213628499@qq.com
 * @date 2024/12/19
 * @version v1.0
*/
class WePiggy{

    constructor(
        configs,
        authentication = null,
        ChatFunction = glmModelChat, 
        GenImgFunction = glmGenerateImage, 
        RecImgFunction = glmRecognizeImage
    ){
        // get configs
        this.configs = configs
        //get custom authentication to use models
        this.authentication = authentication
        // get ChatFunction, default use glmModelChat
        this.ChatFunction = ChatFunction
        // get ChatFunction, default use glmGenerateImage
        this.GenImgFunction = GenImgFunction
        // get ChatFunction, default use glmRecognizeImage
        this.RecImgFunction = RecImgFunction
        //set wechay bot logic
		this.bot = WechatyBuilder.build()
            .on('scan', async (code) => {console.log("⭐二维码链接复制后请在浏览器打开:\n" + await qr2url.toDataURL(code) + "\n");})
            .on('login',async (user) => {console.log(`⭐用户${user.name()}登录成功\n`)})
            .on('message', this.onMessage.bind(this));
    }

    async getConfigByMessage(message){
        // get config linked to this message from configs by chat name
        let chat = (message.room()) ? (await message.room().topic()) : message.talker().name()
        return this.configs.find(config => {
            if(chat === config.chat) return true;
            return false;
        });
    }

    async setUpCommand(message,config){
        //set piggy offline
        if (message.text()==="SLEEP" && config.status) {
            config.status = false;
            message.say("已下线");
            return true;
        }
        //set piggy online
        if (message.text() === "AWAKE" && !config.status) {
            config.status = true;
            message.say("已上线");
            return true;
        }
        //clear piggy's memeory
        if (message.text() === "CLEAR" || config.messages.length >= 100) {
            message.say("共"+ config.messages.length +"条对话记忆清除完毕");
			config.messages = [];
            return true;
        }
        //use piggy's image generation ability
        if (message.text()!=="" && message.text().startsWith("IMAGE ") && config.genOn){
            let prompt = message.text().substring(6)
            //avoid waste tokens to generate useless img
            if (prompt.length < 10) await handler.say("描述太短，长度需要大于10");
            else{
                await message.say("正在生成图像，请等待...");
                //call the image generate function
			    let url = await this.GenImgFunction(prompt ,this.authentication)
                if(url === null) await message.say("生成失败");
                else{
                    await message.say(FileBox.fromUrl(url));
                    console.log(`[${new Date().getTime()}] 生成图片成功`)
                }
            }
            return true;
        }

        return false;
    }
    
    async isMessageWorth(message ,config){
        // 1.check if piggy is offline
        if (!config.status) return false;

        // 2.check messgae type
        let type = message.type();
        if(!config.recOn && (type === 5 || type === 6)) return false;
        if(type !== 5 && type !== 6 && type !== 7) return false;

        // 3.check if it's piggy's own message
        if(message.self())return false;

        // 4.passed the probabilistic identification (except @)
        if(Math.random() >= config.freq && ! await message.mentionSelf())return false;

        return true;
    }

    async handleImageMessage(message){
        let imageBuffer = null
        // type is emoji
        if(message.type() == 5){
            // get emoji download path
            let url = message.text().replace(/\s/g,"").replace(/&amp;amp;/g,"&")
                .split('cdnurl=')[1].split('designerid')[0].replace(/^['"]|['"]$/g, '');
            await url_toBuffer(url).then((buffer)=>{imageBuffer = buffer})
        }
        // type is photo
        else if (message.type() == 6){
            let filebox = await message.toFileBox()
            await filebox_toBuffer(filebox).then((buffer)=>{imageBuffer = buffer})
        }
        if(imageBuffer === null) return;
        //call the image recognize function
        let description =  await this.RecImgFunction(imageBuffer.toString('base64') ,this.authentication);
        if (description === null) return;
        console.log(`[${new Date().getTime()}] 识别图片成功`)

        return `[一张图片=>${description}]`;
    }

    // experimental features
    async sendRandomEmoji(message ,config){
        if(Math.random() < config.emjFreq){
            let filebox = await urlToFileBox("https://uapis.cn/api/imgapi/bq/eciyuan.php");
            if (filebox !== null){
                console.log(`[${new Date().getTime()}] 表情包获取成功`)
                await message.say(filebox);
            }
        }
    }

    async handleTextMessage(message ,config ,description){
        // if message is a image
        let content = (description === null)? message.text() : description;
        // message format
        content = "说话人：" + message.talker().name() + ", 内容：" + content;
        //the first message should has prompt
        content = (config.messages.length === 0) ? (config.prompt + content) : content ;

        config.messages.push({ role: "user", content: content});
        //call chat function
        this.ChatFunction(config.messages ,this.authentication).then(async(res) => {
            config.messages.push({ role: "assistant", content: res });
            await message.say(res);
            console.log(`[${new Date().getTime()}] 回复消息成功`)
        }).catch(async(e) => {
            //handle the Error
            console.error(e)
            await message.say("掉线中...");
        });
        
    }

    async onMessage(message){
        // get config linked to this message
        let config = await this.getConfigByMessage(message);
        if(config === undefined) return;

        // 2.set up command and judge if this message is a command
        let isCmd = await this.setUpCommand(message,config);
        if(isCmd == true) return;

        // 3. determine whether this message is worth paying attention to
        let isWorth = await this.isMessageWorth(message ,config);
        if(isWorth == false) return;
        console.log(`[${new Date().getTime()}] 接收到可用信息`)

        // 4.judge if this message is an image
        // if true ,get the description of this image , not get null
        let description = await this.handleImageMessage(message ,config);

        // 5.send Random emoji
        await this.sendRandomEmoji(message ,config)

        // 6. the main part : chat with large language model
        await this.handleTextMessage(message ,config , description);
    }

    run() {
		this.bot.start();
        console.log(`⭐we-piggy 已经启动，验证登录中...\n`);
	}

}

module.exports = { WePiggy ,loadYamlConfig ,loadGlmAuthen}