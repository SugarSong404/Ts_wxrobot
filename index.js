const { WechatyBuilder }  = require('wechaty');
const { chatAi } = require('./chatModel');
const { getCFG } = require('./getConfig');
const qrcode  = require('qrcode-terminal');
 
class weChaty {
	bot = null
	name = ""
	wxList = []
	constructor(){
		this.bot =  WechatyBuilder.build();
		this.bot.on('scan', code => {qrcode.generate(code, { small: true });})
		this.bot.on('login', user => {
			console.log("登录成功，正在加载配置文件")
			this.name=user.payload.name
			try {
				this.wxList = getCFG();
				console.log("成功加载配置：", this.wxList);
			} catch (error) {
				console.error("加载配置失败：", error.message);
			}
		})
		this.bot.on('message', this.onMessage.bind(this));
	}

    onMessage(message) {
        if (message.payload.type !== 7) return;

        const wxConfig = this.wxList.find(config => {
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

        const que = "说话人：" + senderName + ", 内容：" + message.text();
        if (wxConfig.messages.length === 0) {
            wxConfig.messages.push({ role: "user", content: wxConfig.prompt + que });
        } else {
            wxConfig.messages.push({ role: "user", content: que });
        }

        chatAi(wxConfig.messages).then((res) => {
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
new weChaty().run();
