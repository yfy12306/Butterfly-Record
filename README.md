# Butterfly Collection (移动端)

本仓库是一个基于 Expo + React Native 的蝴蝶采集/记录移动端应用。

## 主要特性
- 通过相机或相册添加蝴蝶观测记录
- 本地 SQLite 存储观测数据
- 支持图片处理和位置记录
- 集成 AI 识别（本地/云端服务抽象）
- 导出/备份功能

## 技术栈
- React Native (Expo)
- TypeScript
- Expo Router
- SQLite (expo-sqlite)
- NativeWind (TailwindCSS for RN)
- Jest + @testing-library for 测试

## 环境要求
- Node.js（推荐 v18+）
- Yarn 或 npm
- Expo CLI（用于本地开发）

## 快速开始

1. 克隆仓库到本地：

```bash
git clone <your-repo-url>.git
cd butterfly-collection-mobile
```

2. 安装依赖（使用你偏好的包管理器）：

```bash
npm install
# 或
yarn install
```

3. 启动开发服务（在设备或模拟器上运行）：

```bash
npm run start
# 或
yarn start
```

4. 运行到 Android 模拟器或连接设备：

```bash
npm run android
# 或
yarn android
```

5. 运行到 iOS 模拟器（macOS）：

```bash
npm run ios
# 或
yarn ios
```

6. 在 Web 上运行：

```bash
npm run web
# 或
yarn web
```

## 常用脚本
- `start`: 启动 Expo 开发服务器（`expo start`）
- `android`: 运行到 Android（`expo run:android`）
- `ios`: 运行到 iOS（`expo run:ios`）
- `web`: 在浏览器中运行（`expo start --web`）
- `test`: 运行测试（`jest`）
- `typecheck`: TypeScript 类型检查（`tsc --noEmit`）

## 运行测试

```bash
npm run test
# 或
yarn test
```

## 将项目上传到 GitHub（示例）

如果你还没在本地初始化仓库并关联远程仓库，按下面步骤操作：

```bash
# 在项目根目录执行（若尚未初始化）
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 上创建一个新仓库，然后添加远程并推送
git remote add origin git@github.com:USERNAME/REPO.git
git branch -M main
git push -u origin main
```

如果你使用 HTTPS：

```bash
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## 备份与发布
- 项目包含导出/备份逻辑（参考 `src/lib/backup-archive.ts` 与 `src/services/backup`）。
- 若使用 EAS 构建与发布，请参考 Expo EAS 官方文档并配置 `eas.json`。

## 贡献
- 欢迎提交 issue 和 PR。请在贡献前先运行 `npm run test` 并确保类型检查通过：

```bash
npm run typecheck
npm run test
```



---

如果你希望我代为创建 GitHub 仓库并推送（需要你提供仓库 URL 或授权方式），或者把 README 翻译成英文/补充图片和徽章，请告诉我下一步。 
