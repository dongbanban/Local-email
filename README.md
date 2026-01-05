<!--
 * @file: /Users/i104/Local-email/README.md
 * @author: dongyang
-->

# Forward Email - VSCode 插件

一个简单实用的 VSCode 插件，用于快速将 HTML 文件作为邮件发送到指定收件人。

## 功能特性

- 🚀 右键点击 HTML 文件即可发送邮件
- 📧 支持配置多个收件人
- 🔐 支持 Gmail SMTP 服务
- 🔄 自动重试机制，提高发送成功率
- 📊 发送结果统计和详细反馈

## 安装

直接搜索 Forward Email

## 配置

### 1. 打开设置

- 方式一：VSCode 设置 → 搜索 "Forward Email"
- 方式二：命令面板 → "配置邮件设置"

### 2. 配置必需项

一般只需要配置收、发件人，Gmail 邮箱授权码/应用专用密码

**注意**：
生成 Gmail 应用专用密码
前提条件
Gmail 账户必须启用两步验证

步骤 1：启用两步验证（如果未启用）
访问 https://myaccount.google.com/security
找到 "两步验证" 并点击
按照提示完成设置（需要手机验证）
步骤 2：生成应用专用密码
两步验证启用后，访问 https://myaccount.google.com/apppasswords
如果提示登录，输入 Google 账户密码
在下拉菜单中：
选择应用：选择 "邮件"
选择设备：选择 "其他（自定义名称）"
输入名称：VSCode Forward Email
点击 生成
会显示 16 位密码，格式类似：xxxx xxxx xxxx xxxx
⚠️ 复制这个密码（只显示一次！）

## 使用方法

1. 在 VSCode 资源管理器中找到要发送的 HTML 文件
2. 右键点击该文件
3. 选择 "Forward Email"
4. 确认收件人信息
5. 等待发送完成

## 高级配置

### 发送选项

```json
{
  // 发送失败重试次数
  "forwardEmail.sendOptions.retryTimes": 2,

  // 重试间隔（毫秒）
  "forwardEmail.sendOptions.retryDelay": 1000
}
```

## 常见问题

### 1. Gmail 提示"用户名或密码错误"

- 确保使用的是应用专用密码，而不是 Gmail 登录密码
- 在 Google 账户设置中生成应用专用密码

### 2. 邮件发送到垃圾箱

- 建议使用与发件人匹配的 SMTP 服务器
- 确保邮件内容格式正确

## 技术栈

- TypeScript
- VSCode Extension API
- Nodemailer

## 开发命令

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式编译
npm run watch

# 打包
vsce package
```

## 许可证

MIT
