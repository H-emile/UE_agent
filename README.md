# Blueprint Copilot 🎮

UE蓝图构思助手 - 一款面向UE游戏从业者的AI辅助工具，将自然语言转化为UE蓝图逻辑草图。

## ✨ 功能特点

- **自然语言输入**：用中文描述游戏需求，自动生成蓝图逻辑
- **AI智能生成**：接入SiliconFlow API，使用DeepSeek模型分析需求
- **本地规则引擎**：内置语义分析，即使没有API Key也能生成蓝图
- **可视化画布**：UE风格的节点画布，支持缩放、拖拽
- **节点悬停提示**：悬停查看节点详细说明，帮助新手理解
- **导出功能**：支持导出JSON、Markdown格式

## 🚀 快速开始

### 方式一：直接打开（推荐）

1. 打开 `frontend/index.html` 文件
2. 在输入框中输入需求描述
3. （可选）输入SiliconFlow API Key获得更好的生成效果
4. 点击"生成蓝图"按钮

### 方式二：使用本地服务器

```bash
cd backend
npm install
npm start
```

然后访问 http://localhost:3000

## 📝 使用示例

输入以下需求，系统会自动生成蓝图：

```
设计一个角色跳跃系统：当玩家按下空格键时，如果角色在地面则跳跃，在空中则二段跳。落地后恢复跳跃能力。
```

```
设计一个敌人波次系统：游戏开始时设置当前波次为1，每波生成3个敌人，每隔2秒生成一个，生成完后播放波次完成音效，等待3秒后进入下一波。当波次达到5波时游戏胜利。
```

## 🔧 技术栈

- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **后端**：Node.js + Express
- **AI服务**：SiliconFlow API (DeepSeek-R1-0528-Qwen3-8B)
- **可视化**：SVG Canvas

## 📦 项目结构

```
UE_agent/
├── frontend/           # 前端页面
│   └── index.html     # 主页面
├── backend/           # 后端服务
│   ├── server.js      # API服务
│   └── package.json   # 依赖配置
├── examples/          # 示例蓝图
│   └── wave-system.json
├── .gitignore         # Git忽略文件
└── README.md          # 项目说明
```

## 🔑 API Key配置

1. 注册 [SiliconFlow](https://siliconflow.cn/) 账号
2. 获取API Key
3. 在前端页面输入框中填入API Key

**注意**：API Key仅用于调用SiliconFlow API，不会存储在服务器端。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！
