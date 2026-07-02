# 六了个六解析助手

微信小程序 - 支持抖音/快手/小红书无水印视频和图片解析

## 项目结构

```
liulege-parser/
├── project.config.json          # 微信开发者工具项目配置
├── vercel.json                  # Vercel 部署配置
├── miniprogram/                 # 小程序前端
│   ├── app.js                   # 入口文件（登录、全局请求）
│   ├── app.json                 # 全局配置（页面路由、tabBar、深色模式）
│   ├── app.wxss                 # 全局样式（CSS变量、深色模式）
│   ├── pages/
│   │   ├── index/               # 首页 - 链接输入&解析
│   │   ├── result/              # 结果页 - 展示解析结果&下载
│   │   ├── history/             # 历史页 - 解析记录列表
│   │   └── profile/             # 我的 - 配额&设置
│   ├── components/
│   │   ├── nav-bar/             # 自定义导航栏
│   │   ├── card/                # 通用卡片组件
│   │   ├── empty-state/         # 空状态组件
│   │   └── loading/             # 加载组件
│   ├── utils/
│   │   ├── util.js              # 通用工具函数
│   │   └── api.js               # 后端 API 调用封装
│   └── styles/
│       └── theme.json           # 深色/亮色主题变量
└── server/                      # Express 后端
    ├── index.js                 # 入口文件
    ├── config/db.js             # MongoDB 连接
    ├── models/
    │   ├── User.js              # 用户模型
    │   └── History.js           # 解析历史模型
    ├── middleware/auth.js       # JWT 认证中间件
    └── routes/
        ├── login.js             # 登录接口
        ├── parse.js             # 解析接口
        ├── quota.js             # 配额接口
        └── history.js           # 历史接口
```

## 技术栈

- **前端**：微信小程序原生 + CSS Variables
- **后端**：Express + MongoDB + JWT
- **部署**：Vercel（免费）+ MongoDB Atlas（免费 512MB）
- **广告**：微信激励视频广告组件

## 部署步骤

### 第一步：MongoDB Atlas（免费数据库）

1. 访问 [mongodb.com/atlas](https://www.mongodb.com/atlas) 注册
2. 创建免费集群（选 AWS / 新加坡区域）
3. 在 Security → Database Access 创建用户
4. 在 Security → Network Access 添加 `0.0.0.0/0`
5. 点击 Connect → Drivers → 复制连接字符串

### 第二步：获取微信小程序密钥

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 开发管理 → 开发设置 → 获取 AppSecret（小程序密钥）

### 第三步：部署后端到 Vercel

1. 把项目上传到 GitHub 仓库
2. 访问 [vercel.com](https://vercel.com)，用 GitHub 登录
3. Import 你的仓库
4. 在 Vercel 项目设置 → Environment Variables 添加：

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/liulege
WX_APPID=wxd0d74f297b07252a
WX_SECRET=你的小程序密钥
JWT_SECRET=随便一段随机字符串
```

5. 部署后获得域名，如 `https://liulege.vercel.app`

### 第四步：小程序配置

1. 打开 `miniprogram/app.js`，修改第 14 行：
```javascript
apiBase: 'https://你的域名.vercel.app/api',
```

2. 在微信公众平台 → 开发管理 → 服务器域名，添加：
   - request合法域名：`你的域名.vercel.app`

3. 微信开发者工具点击编译即可运行

### 第五步：对接解析 API（可选）

编辑 `server/routes/parse.js`，在 `.env` 中添加：
```
PARSE_API_KEY=你的天行数据API密钥
```

推荐解析服务：
- 天行数据 (tianapi.com) - 抖音/快手解析
- 聚合数据 (juhe.cn)

## 功能特性

- ✅ 微信一键登录（openid + JWT）
- ✅ 支持抖音/快手/小红书分享链接
- ✅ 显示标题、作者、描述、封面
- ✅ 无水印视频/图片直链
- ✅ 每日免费 5 次解析
- ✅ 激励视频广告获取额外次数
- ✅ 解析历史记录
- ✅ 深色/亮色模式自动适配
- ✅ 简洁现代的卡片布局
- ✅ 完全免费部署（Vercel + MongoDB Atlas）
