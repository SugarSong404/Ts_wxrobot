const { WechatyBuilder }  = require('wechaty');
const { chatAi } = require('./chatModel');
const { getCFG } = require('./getConfig');
const qr2url = require('qrcode');

class weChaty {
	bot = null
	name = ""
	wxrobot = {}
	constructor(){
		this.bot =  WechatyBuilder.build();
		this.bot.on('scan', async (code) => {console.log("二维码链接复制后请在浏览器打开:\n" + await qr2url.toDataURL(code));})
		this.bot.on('login', user => {this.name=user.payload.name;console.log(`用户${this.name}登录成功`)})
		this.bot.on('message', this.onMessage.bind(this));
	}

    onMessage(message) {
        if (message.payload.type !== 7) return;

        const wxConfig = this.wxrobot.list.find(config => {
            if (message.room() && config.chat === message.room().payload.topic) return true;
            if (!message.room() && config.chat === message.talker().payload.name) return true;
            return false;
        });

        if (!wxConfig) return;

        const handler = message.room() || message.talker();
        const senderName = message.talker().payload.name;
        if (!senderName || message.self()) return;

        if (message.text().indexOf("=SLEEP") !== -1 && wxConfig.status) {
            wxConfig.status = false;
            handler.say("已下线");
            return;
        } else if (message.text().indexOf("=AWAKE") !== -1 && !wxConfig.status) {
            wxConfig.status = true;
            handler.say("已上线");
            return;
        }
        if (!wxConfig.status) return;

        if (message.text().indexOf("=CLEAR") !== -1 || wxConfig.messages.length >= 100) {
            handler.say("共"+ wxConfig.messages.length/2 +"条对话记忆清楚完毕");
			wxConfig.messages = [];
            return;
        }

        if(Math.random() >= wxConfig.freq && message.text().indexOf(this.name)==-1)return;

        const que = "说话人：" + senderName + ", 内容：" + message.text();
        if (wxConfig.messages.length === 0) {
            wxConfig.messages.push({ role: "user", content: wxConfig.prompt + que });
        } else {
            wxConfig.messages.push({ role: "user", content: que });
        }

        chatAi(wxConfig.messages,this.wxrobot.api).then((res) => {
            wxConfig.messages.push({ role: "assistant", content: res.content });
            handler.say(res.content);
        }).catch(() => {
            handler.say("掉线中...");
        });
    }

	run() {
		this.bot.start();
	}
}

const chaty = new weChaty()
try {
    chaty.wxrobot = getCFG();
    console.log(`成功加载配置文件：`);
    console.log(`使用模型:${chaty.wxrobot.api.model}，共有${chaty.wxrobot.list.length}条对话域设置\n`)
    chaty.run();
} catch (error) {
    console.error("加载配置失败：", error.message);
}
