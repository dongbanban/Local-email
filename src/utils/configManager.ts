/**
 * 配置管理模块
 *
 * 负责从 VSCode 设置中读取邮件配置
 */

import * as vscode from "vscode";
import type { EmailConfig } from "../types/email.types";

/**
 * 配置管理类
 */
export class ConfigManager {
  /**
   * 从 VSCode 配置中获取邮件配置
   * @returns 邮件配置对象
   * @throws 如果配置不完整则抛出错误
   */
  static getEmailConfig(): EmailConfig {
    const config = vscode.workspace.getConfiguration("forwardEmail");

    // 获取 SMTP 配置
    const smtpHost = config.get<string>("smtp.host", "smtp.gmail.com");
    const smtpPort = config.get<number>("smtp.port", 587);
    const smtpSecure = config.get<boolean>("smtp.secure", false);
    const smtpUser = config.get<string>("smtp.user", "");
    const smtpPassword = config.get<string>("smtp.password", "");

    // 获取发件人配置
    const fromName = config.get<string>("from.name", "Email Test");

    // 获取收件人列表
    const recipients = config.get<string[]>("recipients", []);

    // 获取发送选项
    const retryTimes = config.get<number>("sendOptions.retryTimes", 2);
    const retryDelay = config.get<number>("sendOptions.retryDelay", 1000);

    // 验证必需配置
    if (!smtpUser) {
      throw new Error("请先配置发件人邮箱地址（forwardEmail.smtp.user）");
    }

    if (!smtpPassword) {
      throw new Error(
        "请先配置邮箱授权码/应用专用密码（forwardEmail.smtp.password）"
      );
    }

    if (recipients.length === 0) {
      throw new Error("请先配置至少一个收件人邮箱（forwardEmail.recipients）");
    }

    return {
      smtp: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
      from: {
        name: fromName,
        email: smtpUser, // 发件人邮箱与 SMTP 认证账户一致
      },
      // 回复地址（可选，提高邮件可信度）
      replyTo: {
        name: fromName,
        email: smtpUser,
      },
      recipients,
      sendOptions: {
        retryTimes,
        retryDelay,
      },
    };
  }

  /**
   * 验证邮箱地址格式
   * @param email 邮箱地址
   * @returns 是否有效
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 打开配置页面
   */
  static openSettings(): void {
    vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "forwardEmail"
    );
  }
}
