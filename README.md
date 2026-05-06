# 扫雷.py PWA

Python终端风格扫雷游戏，支持离线安装到手机主屏幕。

## 部署到 Vercel（免费，5分钟）

### 方法一：GitHub + Vercel（推荐）

1. 把这个文件夹上传到 GitHub（新建仓库，上传所有文件）
2. 打开 https://vercel.com，用 GitHub 账号登录
3. 点击 "New Project" → 选择你的仓库
4. 框架选 "Create React App"，点击 Deploy
5. 等待约1分钟，获得网址如 `https://minesweeper-xxx.vercel.app`

### 方法二：Vercel CLI

```bash
npm install -g vercel
cd minesweeper-pwa
npm install
npm run build
vercel --prod
```

## 安装到手机主屏幕

**Android（Chrome）：**
1. 用 Chrome 打开网址
2. 点右上角菜单 → "添加到主屏幕"
3. 确认安装，图标出现在桌面

**iOS（Safari）：**
1. 用 Safari 打开网址
2. 点底部分享按钮 →「添加到主屏幕」
3. 确认，图标出现在桌面

## 手机操作说明

- **点击** = 揭开格子
- **长按（0.5秒）** = 插旗 / 取消旗子
- **⚑ 按钮** = 切换插旗模式（点击变插旗）
