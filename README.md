# Ts_wxrobot
A JSON file-configurable WeChat chatbot based on the wxchat library, embedded with a large model. The code is simple and low-coupling, and most locations can be easily modified to achieve custom effects

**该库使用到的技术来自有着21K星标的wechaty仓库，感谢大佬的开源**

[wechaty/wechaty: Conversational RPA SDK for Chatbot Makers. Join our Discord: https://discord.gg/7q8NBZbQzt](https://github.com/wechaty/wechaty?tab=readme-ov-file)

**如何使用我的项目？**

1.根据package.json配置好所需环境

```
npm install
```

2.打开config.json文件，其中是默认的配置范式

wxList下每一个对象都代表着一个对话域，可以是群聊，也可以是单独的好友

- chat属性设置群聊或好友的名称
- status表示程序启动时机器人为休眠还是启动，默认为true启动，在聊天过程中也可以使用"=SLEEP"与"=AWAKE"指令来改变状态
- prompt则表示机器人的预设词
- messgaes存储所有聊天，大于50条对话会自己清理一次，你也可以发送"=CLEAR"指令手动清理

3.其他文件

getConfig文件用于读取配置，除非想修改配置文件的格式，不然默认不用修改

chatModel我使用的是智谱清言的4-plus模型，使用时只需替换自身的api-key以及模型名就可以直接用了，不想使用智谱清言的同学也可以修改为其他模型：其中的chatAi函数返回一个res，调用res.content要返回回答文本，而这个函数的输入就是聊天内容数组了，格式一般为

```js
[
{role:"user",content:"好人，坏AI"},
{role:"assistant",content:"我上早八"},
...
]
```

4.运行

```
node index.js
```

