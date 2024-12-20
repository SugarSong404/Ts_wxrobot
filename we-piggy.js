const { WechatyBuilder}  = require('wechaty');
const { FileBox } = require('file-box');
const { url_toBuffer ,filebox_toBuffer ,urlToFileBox} = require('./utils/processImage');
const loadYamlConfig = require("./utils/loadConfig")
const loadGlmAuthen = require("./glm-apis/glmAuthen")
const glmModelChat = require('./glm-apis/glmChat');
const glmRecognizeImage = require('./glm-apis/glmRecImg');
const glmGenerateImage = require('./glm-apis/glmGenImg');
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

    //print debug info
    logout(level ,content){
        let pre = ""
        if(level === 0)pre = (level === 0)?"\n⭐":"";
        else pre += "\t".repeat(level)
        console.log(pre,`~[${new Date().getTime()}]` ,content);
    }

    async getConfigByMessage(message){
        // get config linked to this message from configs by chat name
        let chat = (message.room()) ? (await message.room().topic()) : message.talker().name()
        return this.configs.find(config => {
            if(chat === config.chat){
                this.logout(0 ,`收到来自'${chat}'对话域的消息，发送人'${message.talker().name()}'`);
                return true;
            }
            return false;
        });
    }

    async setUpCommand(message,config){
        //set piggy offline
        if (message.text()==="SLEEP" && config.status) {
            config.status = false;
            await message.say("已下线");
            this.logout(1 ,`收到SLEEP指令，已下线`);
            return true;
        }
        //set piggy online
        if (message.text() === "AWAKE" && !config.status) {
            config.status = true;
            await message.say("已上线");
            this.logout(1 ,`收到AWAKE指令，已上线`);
            return true;
        }
        //clear piggy's memeory
        if (message.text() === "CLEAR" || config.messages.length >= 100) {
            await message.say("共"+ config.messages.length +"条对话记忆清除完毕");
            this.logout(1 ,`收到CLEAR指令，共${config.messages.length}条对话记忆清除完毕`);
			config.messages = [];
            return true;
        }
        //use piggy's image generation ability
        if (message.text()!=="" && message.text().startsWith("IMAGE ") && config.genOn){
            this.logout(1 ,`收到IMAGE指令`);
            let prompt = message.text().substring(6)

            //avoid waste tokens to generate useless img
            if (prompt.length < 10) {
                this.logout(2 ,`描述太短，长度需要大于10`);
                await message.say("描述太短，长度需要大于10");
            }
            else{
                this.logout(2 ,`正在生成图像，请等待...`);
                await message.say("正在生成图像，请等待...");
                //call the image generate function
			    let url = await this.GenImgFunction(prompt ,this.authentication);
                if(url === null){
                    this.logout(2 ,`生成失败`);
                    await message.say("生成失败");
                }
                else{
                    await message.say(FileBox.fromUrl(url));
                    this.logout(2 ,`生成图片成功`);
                }
            }
            return true;
        }

        return false;
    }
    
    async isMessageWorth(message ,config){
        // 1.check if piggy is offline
        if (!config.status){
            this.logout(1 ,`不予回复，当前piggy不在线`);
            return false;
        }
        // 2.check messgae type
        let type = message.type();
        if( (!config.recOn && (type === 5 || type === 6)) || (type !== 5 && type !== 6 && type !== 7) ){
            this.logout(1 ,`不予回复，当前消息类型不支持`);
            return false;
        }
        // 3.check if it's piggy's own message
        if(message.self()){
            this.logout(1 ,`不予回复，这是piggy自身的消息`);
            return false;
        }
        // 4.passed the probabilistic identification (except @)
        if(Math.random() >= config.freq && ! await message.mentionSelf()){
            this.logout(1 ,`不予回复，回复概率判定未选中`);
            return false;
        }

        return true;
    }

    async handleImageMessage(message){
        //this func only handle image messsage
        if(message.type() !== 6 && message.type() !== 5) return null;
        this.logout(1 ,`获取图片数据，处理中`);
        //if recognize fail
        const fail = `[一张图片=>由于接收问题你没有看清这种图片，你需要在回答中提到"接收问题"这一点]`;
        let imageBuffer = null
        try{
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
        }catch(e){
            this.logout(2 ,`图片数据处理失败，原因：${e}`);
            return fail;
        }
        this.logout(2 ,`图片数据处理成功，正在识别`);
        //call the image recognize function
        let description =  await this.RecImgFunction(imageBuffer.toString('base64') ,this.authentication);
        if (description === null){
            this.logout(3 ,`识别失败`);
            return fail;
        }
        this.logout(3 ,`识别成功，描述见'消息内容'`);

        return `[一张图片=>${description}]`;
    }

    // experimental features
    async sendRandomEmoji(message ,config){
        //check freq
        if(Math.random() < config.emjFreq){
            this.logout(1 ,`表情包发送概率选中，抓取中`);
            let filebox = null
            try{
                //transform this url to filebox
                filebox = await urlToFileBox("https://uapis.cn/api/imgapi/bq/eciyuan.php");
            }catch(e){
                this.logout(2 ,`表情包抓取失败，原因：${e}`);
                return;
            }

            if (filebox !== null){
                this.logout(2 ,`表情包抓取成功，发送中`);
                //dont forget the error while sending
                try{
                    await message.say(filebox);
                    this.logout(3 ,`表情包发送成功`);
                }catch(e){
                    this.logout(3 ,`表情包发送失败，原因：${e}`);
                }
            }else{
                this.logout(2 ,`表情包抓取失败`);
            }
        }
    }

    async handleTextMessage(message ,config ,description){
        // if message is a image
        let content = (description === null)? message.text() : description;
        this.logout(1 ,`准备回复，消息内容：[${content.replace(/\n/g,"").replace(/\r/g,"").trim().substring(0,20)}...]`);
        // message format
        content = "说话人：" + message.talker().name() + ", 内容：" + content;
        //the first message should has prompt
        content = (config.messages.length === 0) ? (config.prompt + content) : content ;

        config.messages.push({ role: "user", content: content});
        //call chat function
        this.ChatFunction(config.messages ,this.authentication).then(async(res) => {
            config.messages.push({ role: "assistant", content: res });
            await message.say(res);
            this.logout(2,`回复成功，内容：[${res.replace(/\n/g,"").replace(/\r/g,"").trim().substring(0,20)}...]`);
        }).catch(async(e) => {
            //handle the Error
            await message.say("掉线中...");
            this.logout(2 ,`回复失败，问题：${e}`);
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
        if(isWorth == false)return;

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