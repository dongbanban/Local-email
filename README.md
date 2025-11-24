# Local Email Sender

邮件批量发送工具，支持批量读取 HTML 模板并发送到指定收件人邮箱。

## 功能特性

- ✉️ 批量发送邮件
- 📁 递归读取目录下所有 HTML 模板
- 🔍 支持通配符匹配（`*` 和 `**`）
- 🔄 自动重试机制
- 📊 发送统计报告
- 🎨 彩色终端输出

## 安装依赖

```bash
npm install
```

## 配置说明

编辑 `config/email.config.js` 文件：

### SMTP 服务器配置

```javascript
smtp: {
  host: "smtp.gmail.com",      // SMTP 服务器地址
  port: 587,                    // 端口号
  secure: false,                // 是否使用 SSL
  auth: {
    user: "your@email.com",     // 发件邮箱
    pass: "your-app-password",  // 应用专用密码
  },
}
```

### 发件人信息

```javascript
from: {
  name: "No Reply",             // 发件人名称
  email: "your@email.com",      // 发件邮箱
}
```

### 收件人列表

```javascript
recipients: ["recipient1@email.com", "recipient2@email.com"];
```

### 邮件模板配置

```javascript
templates: {
  baseDir: "../top-up/email/common-template",  // 模板目录
  files: [],  // 指定模板文件，留空则发送所有 .html 文件
}
```

**files 字段支持以下格式：**

1. **精确匹配**：`["hmp_active_account.html"]` - 匹配指定文件
2. **通配符匹配**：
   - `["hmp_*.html"]` - 匹配 `hmp_` 开头的所有 HTML 文件
   - `["*/active_*.html"]` - 匹配子目录中 `active_` 开头的文件
   - `["**/reset_*.html"]` - 递归匹配所有目录中 `reset_` 开头的文件
3. **混合使用**：`["hmp_*.html", "common/welcome.html", "**/footer_*.html"]`
4. **留空数组**：发送 baseDir 下所有 .html 文件

**示例配置：**

```javascript
// 发送所有文件
files: [];

// 发送特定文件
files: ["hmp_active_account.html", "hmp_reset_password.html"];

// 使用通配符
files: ["hmp_*.html"]; // 所有以 hmp_ 开头的文件

// 递归匹配
files: ["**/footer_*.html"]; // 所有目录中以 footer_ 开头的文件
```

### 发送选项

```javascript
sendOptions: {
  delay: 500,        // 每封邮件间隔（毫秒）
  retryTimes: 2,     // 失败重试次数
  retryDelay: 1000,  // 重试间隔（毫秒）
}
```

## 使用方法

```bash
npm run send
```

## 工作流程

1. 初始化并验证 SMTP 连接
2. 递归读取指定目录下的所有 HTML 模板
3. 遍历收件人列表和模板列表
4. 发送邮件（失败自动重试）
5. 输出发送统计报告

## 统计报告

程序执行完成后会输出：

- 总发送数量
- 成功数量
- 失败数量
- 成功率
- 失败详情（包括收件人、模板名称、错误信息）

## 注意事项

⚠️ **真实发送警告**：此工具会将邮件发送到实际收件人邮箱，请谨慎配置收件人列表。

### Gmail 配置提示

如使用 Gmail，需要：

1. 开启两步验证
2. 生成应用专用密码
3. 使用应用专用密码替代账户密码

## 许可证

MIT
