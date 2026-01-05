/**
 * Forward Email VSCode 插件主入口
 *
 * 功能：
 * 1. 右键点击 HTML 文件显示 "Forward Email" 菜单
 * 2. 点击后将 HTML 文件内容作为邮件发送
 * 3. 支持配置 SMTP 服务器和收件人
 */

import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { EmailService } from "./services/emailService";
import { ConfigManager } from "./utils/configManager";

/**
 * 插件激活时调用
 * @param context 插件上下文
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Forward Email 插件已激活");

  // 注册发送邮件命令
  const sendEmailCommand = vscode.commands.registerCommand(
    "forward-email.sendEmail",
    async (uri: vscode.Uri) => {
      await handleSendEmail(uri);
    }
  );

  // 注册配置命令
  const configureCommand = vscode.commands.registerCommand(
    "forward-email.configure",
    () => {
      ConfigManager.openSettings();
    }
  );

  context.subscriptions.push(sendEmailCommand, configureCommand);
}

/**
 * 处理发送邮件操作
 * @param uri 文件 URI
 */
async function handleSendEmail(uri: vscode.Uri): Promise<void> {
  try {
    // 1. 验证文件是否为 HTML
    if (!uri || path.extname(uri.fsPath) !== ".html") {
      vscode.window.showErrorMessage("请选择一个 HTML 文件");
      return;
    }

    // 2. 读取 HTML 文件内容
    const htmlContent = await readHtmlFile(uri.fsPath);
    if (!htmlContent) {
      vscode.window.showErrorMessage("无法读取 HTML 文件内容");
      return;
    }

    // 3. 获取配置
    let config;
    try {
      config = ConfigManager.getEmailConfig();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const action = await vscode.window.showErrorMessage(
        `配置错误: ${errorMessage}`,
        "打开设置"
      );

      if (action === "打开设置") {
        ConfigManager.openSettings();
      }
      return;
    }

    // 4. 显示确认对话框
    const fileName = path.basename(uri.fsPath);
    const recipientList = config.recipients.join(", ");
    const confirmed = await vscode.window.showInformationMessage(
      `确定要将 "${fileName}" 发送到以下收件人吗？\n${recipientList}`,
      { modal: true },
      "确定",
      "取消"
    );

    if (confirmed !== "确定") {
      return;
    }

    // 5. 发送邮件（显示进度）
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "正在发送邮件...",
        cancellable: false,
      },
      async (progress) => {
        try {
          // 初始化邮件服务
          progress.report({ message: "初始化 SMTP 连接..." });
          const emailService = new EmailService(config);
          await emailService.init();

          // 准备邮件内容
          const emailContent = {
            subject: `${fileName} - 邮件转发`,
            html: htmlContent,
          };

          // 发送邮件
          progress.report({ message: "发送邮件中..." });
          const results = await emailService.sendBatchEmails(
            config.recipients,
            emailContent
          );

          // 关闭连接
          emailService.close();

          // 统计结果
          const successCount = results.filter((r) => r.result.success).length;
          const failedCount = results.length - successCount;

          // 显示结果
          if (failedCount === 0) {
            vscode.window.showInformationMessage(
              `✅ 邮件发送成功！已发送到 ${successCount} 个收件人`
            );
          } else if (successCount === 0) {
            const errors = results
              .filter((r) => !r.result.success)
              .map((r) => `${r.recipient}: ${r.result.error?.message}`)
              .join("\n");
            vscode.window.showErrorMessage(`❌ 邮件发送失败！\n${errors}`);
          } else {
            const failedRecipients = results
              .filter((r) => !r.result.success)
              .map((r) => r.recipient)
              .join(", ");
            vscode.window.showWarningMessage(
              `⚠️ 部分邮件发送失败\n成功: ${successCount}，失败: ${failedCount}\n失败的收件人: ${failedRecipients}`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`邮件发送失败: ${errorMessage}`);
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`操作失败: ${errorMessage}`);
  }
}

/**
 * 读取 HTML 文件内容
 * @param filePath 文件路径
 * @returns HTML 内容
 */
async function readHtmlFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("读取文件失败:", error);
    return null;
  }
}

/**
 * 插件停用时调用
 */
export function deactivate() {
  console.log("Forward Email 插件已停用");
}
