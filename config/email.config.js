/**
 * @file: /Users/i104/Local-email/config/email.config.js
 * @author: dongyang
 */
/**
 * 邮件发送配置文件
 *
 * 常用 SMTP 配置参考:
 *
 * Gmail:
 *   host: "smtp.gmail.com"
 *   port: 587 (TLS) 或 465 (SSL)
 *   secure: false (587端口) 或 true (465端口)
 *   需要使用应用专用密码
 *
 * QQ邮箱:
 *   host: "smtp.qq.com"
 *   port: 587 或 465
 *   secure: true (推荐使用 465 端口)
 *   需要在QQ邮箱设置中开启SMTP服务并获取授权码
 *
 * Outlook/Hotmail:
 *   host: "smtp-mail.outlook.com" 或 "smtp.office365.com"
 *   port: 587
 *   secure: false
 *   使用邮箱密码或应用密码
 *
 * 163邮箱:
 *   host: "smtp.163.com"
 *   port: 465
 *   secure: true
 *   需要开启SMTP服务并使用授权码
 *
 * 注意: 发往 Outlook/QQ 等邮箱时,建议使用对应的SMTP服务器以避免被拒收
 */

export default {
  // SMTP 服务器配置 - Gmail (推荐使用)
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // 对于 Gmail 使用 STARTTLS (端口 587)
    auth: {
      user: "yang.dong@xxx.net",
      pass: "", // Gmail 应用专用密码
    },
    tls: {
      rejectUnauthorized: false,
    },
  },

  // 发件人信息
  from: {
    name: "Email Test",
    email: "yang.dong@xxx.net", // 发件人需与 SMTP 认证账户一致
  },

  // 回复地址（可选，提高邮件可信度）
  replyTo: {
    name: "Email Test",
    email: "yang.dong@xxx.net",
  },

  // 收件人列表
  recipients: [""],

  // 邮件模板目录配置
  templates: {
    // 邮件模板所在目录
    baseDir: "../xx/xx/xxx",
    // 需要发送的邮件模板列表（如果为空数组，则发送 baseDir 下所有 .html 文件）
    // 支持精确匹配：["xx/xx.html"]
    // 支持通配符：["xx/*.html"] 或 ["**/xx.html"]
    files: [],
  },

  // 发送选项
  sendOptions: {
    // 每封邮件发送间隔（毫秒）
    delay: 500,
    // 发送失败时的重试次数
    retryTimes: 2,
    // 重试间隔（毫秒）
    retryDelay: 1000,
  },
};
