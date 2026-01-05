/**
 * 邮件配置类型定义
 */

/**
 * SMTP 服务器配置
 */
export interface SmtpConfig {
  /** SMTP 服务器地址 */
  host: string;
  /** SMTP 服务器端口 */
  port: number;
  /** 是否使用 SSL/TLS */
  secure: boolean;
  /** 认证信息 */
  auth: {
    /** 邮箱账号 */
    user: string;
    /** 邮箱授权码/应用专用密码 */
    pass: string;
  };
  /** TLS 配置 */
  tls?: {
    rejectUnauthorized: boolean;
  };
}

/**
 * 发件人信息
 */
export interface FromConfig {
  /** 发件人显示名称 */
  name: string;
  /** 发件人邮箱地址 */
  email: string;
}

/**
 * 发送选项配置
 */
export interface SendOptions {
  /** 发送失败重试次数 */
  retryTimes: number;
  /** 重试间隔（毫秒） */
  retryDelay: number;
}

/**
 * 完整的邮件配置
 */
export interface EmailConfig {
  /** SMTP 配置 */
  smtp: SmtpConfig;
  /** 发件人信息 */
  from: FromConfig;
  replyTo: FromConfig;
  /** 收件人列表 */
  recipients: string[];
  /** 发送选项 */
  sendOptions: SendOptions;
}

/**
 * 邮件发送结果
 */
export interface SendResult {
  /** 是否发送成功 */
  success: boolean;
  /** 发送信息（成功时） */
  info?: any;
  /** 错误信息（失败时） */
  error?: Error;
}

/**
 * 邮件内容
 */
export interface EmailContent {
  /** 邮件主题 */
  subject: string;
  /** HTML 内容 */
  html: string;
  /** 纯文本内容（可选） */
  text?: string;
}
