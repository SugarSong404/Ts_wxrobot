const { WechatyBuilder}  = require('wechaty');
const { FileBox } = require('file-box');
const { chatAi } = require('./chatModel');
const { getCFG } = require('./getConfig');
const {getRandomEmoji,getImageRealized,sendGenerateImage} = require('./doImage');
const qr2url = require('qrcode');

class weChaty {
	constructor(wxrobot){
        this.wxrobot = wxrobot
		this.bot = WechatyBuilder.build({name: wxrobot.login});
		this.bot.on('scan', async (code) => {console.log("二维码链接复制后请在浏览器打开:\n" + await qr2url.toDataURL(code));})
		this.bot.on('login',async (user) => {
            this.name = user.payload.name;
            console.log(`⭐用户${this.name}登录成功`)
            //this.heart = await this.bot.Contact.find({ name: '文件传输助手' })
            // setInterval(this.heartKeeping, 3600000);
        })
		this.bot.on('message', this.onMessage.bind(this));
	}

    // heartKeeping(){
    //     if(chaty.heart){
    //         chaty.heart.say("已完成状态同步，请忽略此消息")
    //         console.log("已完成状态同步")
    //     }
    // }

    async onMessage(message) {

        if((!this.wxrobot.api.r_img.use&&(message.payload.type === 6||message.payload.type === 5)))return;
        if (message.payload.type !== 7&&message.payload.type !== 6&&message.payload.type !== 5) return;

        const wxConfig = this.wxrobot.list.find(config => {
            if (message.room() && config.chat === message.room().payload.topic) return true;
            if (!message.room() && config.chat === message.talker().payload.name) return true;
            return false;
        });

        if (!wxConfig) return;

        const handler = message.room() || message.talker();
        const senderName = message.talker().payload.name;
        if (!senderName || message.self()) return;

        if (message.text()==="SLEEP" && wxConfig.status) {
            wxConfig.status = false;
            handler.say("已下线");
            return;
        } else if (message.text() === "AWAKE" && !wxConfig.status) {
            wxConfig.status = true;
            handler.say("已上线");
            return;
        }
        if (!wxConfig.status) return;

        if (message.text() === "CLEAR" || wxConfig.messages.length >= 100) {
            handler.say("共"+ wxConfig.messages.length/2 +"条对话记忆清楚完毕");
			wxConfig.messages = [];
            return;
        }

        if (message.text().startsWith("IMAGE ")&&this.wxrobot.api.g_img.use) {
            var prompt = message.text().substring(6)
            if (prompt.length<10) await handler.say("描述太短，长度需要大于10");
            else{
                await handler.say("正在生成图像，请等待...");
			    var url = await sendGenerateImage(prompt,this.wxrobot.api)
                if(!url)await handler.say("生成失败");
                else await handler.say(FileBox.fromUrl(url));
            }
            return;
        }

        if(Math.random() >= wxConfig.freq && message.text().indexOf(this.name)==-1)return;

        if(message.payload.type === 6||message.payload.type === 5){
            var image = await getImageRealized(message,this.wxrobot.api)
            if(!image)return;
            message.payload.text = `[一张图片=>${image}]`
        }

        const que = "说话人：" + senderName + ", 内容：" + message.text();
        if (wxConfig.messages.length === 0) {
            wxConfig.messages.push({ role: "user", content: wxConfig.prompt + que });
        } else {
            wxConfig.messages.push({ role: "user", content: que });
        }
        chatAi(wxConfig.messages,this.wxrobot.api).then(async(res) => {
            wxConfig.messages.push({ role: "assistant", content: res.content });
            if(Math.random() <= this.wxrobot.emoji.freq){
                const file = await getRandomEmoji(this.wxrobot.emoji.web);
                if(file)await handler.say(file);
            }
            await handler.say(res.content);
        }).catch(async(e) => {
            console.error(e)
            await handler.say("掉线中...");
        });
    }

	run() {
		this.bot.start();
	}
}

try {
    const wxrobot = getCFG();
    console.log(`\n⭐成功加载配置文件：`);
    console.log(`   登录机器人：${wxrobot.login}`)
    console.log(`   对话模型:${wxrobot.api.chat.model}，图片理解模型${wxrobot.api.r_img.model}，文生图模型${wxrobot.api.g_img.model}。`)
    console.log(`   读取${wxrobot.list.length}条对话域设置，读取表情包生成网站${wxrobot.emoji.web}\n`)
    new weChaty(wxrobot).run();
} catch (error) {
    console.error("加载配置失败：", error.message);
}
