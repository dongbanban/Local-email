/**
 * 邮件发送服务模块
 *
 * 基于 nodemailer 实现邮件发送功能，支持：
 * - SMTP 服务器配置
 * - 发送重试机制
 * - HTML 邮件内容
 * - 错误处理
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type {
  EmailConfig,
  SendResult,
  EmailContent,
} from "../types/email.types";

/**
 * 邮件发送服务类
 */
export class EmailService {
  /** nodemailer 传输器实例 */
  private transporter: Transporter | null = null;

  /** 邮件配置 */
  private config: EmailConfig;

  /**
   * 构造函数
   * @param config 邮件配置
   */
  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * 初始化邮件传输器并验证连接
   * @returns 是否初始化成功
   */
  async init(): Promise<boolean> {
    try {
      this.transporter = nodemailer.createTransport(this.config.smtp);

      // 验证 SMTP 连接
      await this.transporter.verify();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`SMTP 服务器连接失败: ${errorMessage}`);
    }
  }

  /**
   * 发送单封邮件（带重试机制）
   * @param recipient 收件人邮箱
   * @param content 邮件内容
   * @param retryCount 当前重试次数
   * @returns 发送结果
   */
  async sendEmail(
    recipient: string,
    content: EmailContent,
    retryCount: number = 0
  ): Promise<SendResult> {
    if (!this.transporter) {
      throw new Error("邮件传输器未初始化，请先调用 init() 方法");
    }

    const mailOptions = {
      from: `"${this.config.from.name}" <${this.config.from.email}>`,
      to: recipient,
      subject: content.subject,
      html: content.html,
      text: content.text || this.htmlToText(content.html),
      headers: {
        "X-Mailer": "VS Code Forward Email Extension",
        "X-Priority": "3",
        Importance: "Normal",
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, info };
    } catch (error) {
      // 如果还有重试机会，则重试
      if (retryCount < this.config.sendOptions.retryTimes) {
        await this.delay(this.config.sendOptions.retryDelay);
        return this.sendEmail(recipient, content, retryCount + 1);
      }

      // 重试次数用尽，返回失败
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * 批量发送邮件到多个收件人
   * @param recipients 收件人列表
   * @param content 邮件内容
   * @returns 发送结果数组
   */
  async sendBatchEmails(
    recipients: string[],
    content: EmailContent
  ): Promise<Array<{ recipient: string; result: SendResult }>> {
    const results: Array<{ recipient: string; result: SendResult }> = [];

    for (const recipient of recipients) {
      const result = await this.sendEmail(recipient, content);
      results.push({ recipient, result });
    }

    return results;
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 简单的 HTML 转纯文本
   * 移除 HTML 标签和特殊字符，用于邮件的 text 版本
   * @param html HTML 内容
   * @returns 纯文本内容
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, "")
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * 关闭邮件传输器
   */
  close(): void {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}
