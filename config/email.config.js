/**
 * @file: /Users/i104/Local-email/config/email.config.js
 * @author: dongyang
 */
/**
 * 邮件发送配置文件
 */

export default {
  // SMTP 服务器配置
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "yang.dong@xxx.net",
      pass: "cibjqdaxryvhtevy", // Gmail 应用专用密码
    },
  },

  // 发件人信息
  from: {
    name: "No Reply",
    email: "yang.dong@xxx.net",
  },

  // 收件人列表
  recipients: ["yang.dong@xxx.net"],

  // 邮件模板目录配置
  templates: {
    // 邮件模板所在目录
    baseDir: "",
    // 需要发送的邮件模板列表（如果为空数组，则发送 baseDir 下所有 .html 文件）
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
