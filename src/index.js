/**
 * 邮件批量发送主程序
 */

import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import config from "../config/email.config.js";

class EmailSender {
  constructor() {
    this.transporter = null;
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      failedList: [],
    };
  }

  /**
   * 初始化邮件传输器
   */
  async init() {
    console.log(chalk.blue("📧 初始化邮件传输器..."));
    console.log(chalk.yellow("  ⚠️  邮件将发送到实际收件人邮箱！"));

    this.transporter = nodemailer.createTransport(config.smtp);

    // 验证连接
    try {
      await this.transporter.verify();
      console.log(chalk.green("✓ SMTP 服务器连接成功"));
      console.log(
        chalk.gray(`  服务器: ${config.smtp.host}:${config.smtp.port}`)
      );
      return true;
    } catch (error) {
      console.log(chalk.red("✗ SMTP 服务器连接失败"));
      console.log(chalk.red(`  错误信息: ${error.message}`));
      console.log(chalk.yellow("\n💡 请检查SMTP配置是否正确:"));
      console.log(chalk.gray("   - 邮箱地址和授权码"));
      console.log(chalk.gray("   - SMTP服务器地址和端口"));
      return false;
    }
  }

  /**
   * 递归获取目录下所有 .html 文件
   */
  async getHtmlFilesRecursively(dir) {
    const htmlFiles = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // 递归读取子目录
          const subFiles = await this.getHtmlFilesRecursively(fullPath);
          htmlFiles.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(".html")) {
          // 收集 .html 文件
          htmlFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠ 读取目录失败: ${dir}`));
    }

    return htmlFiles;
  }

  /**
   * 匹配文件路径（支持通配符）
   */
  matchPattern(filePath, pattern) {
    // 统一使用正斜杠
    const normalizedFilePath = filePath.replace(/\\/g, "/");
    const normalizedPattern = pattern.replace(/\\/g, "/");

    // 简单的通配符匹配：支持 * 和 **
    const regexPattern = normalizedPattern
      .replace(/\./g, "\\.")
      .replace(/\*\*/g, ":::DOUBLE_STAR:::")
      .replace(/\*/g, "[^/]*")
      .replace(/:::DOUBLE_STAR:::/g, ".*");

    const regex = new RegExp(`^${regexPattern}$`);
    const matched = regex.test(normalizedFilePath);

    return matched;
  }

  /**
   * 获取所有邮件模板文件
   */
  async getTemplateFiles() {
    const { baseDir, files } = config.templates;
    const templatesDir = path.resolve(process.cwd(), baseDir);

    console.log(chalk.blue("\n📁 读取邮件模板..."));
    console.log(chalk.gray(`  目录: ${templatesDir}`));

    try {
      await fs.access(templatesDir);
    } catch (error) {
      console.log(chalk.red(`✗ 模板目录不存在: ${templatesDir}`));
      return [];
    }

    let templateFiles = [];

    if (files && files.length > 0) {
      // 使用配置中指定的文件（支持通配符）
      console.log(chalk.gray(`  匹配规则: ${files.join(", ")}`));
      const allHtmlFiles = await this.getHtmlFilesRecursively(templatesDir);

      for (const pattern of files) {
        // 检查是否包含通配符
        if (pattern.includes("*")) {
          // 使用通配符匹配
          const matched = allHtmlFiles.filter((file) => {
            const relativePath = path.relative(templatesDir, file);
            return this.matchPattern(relativePath, pattern);
          });

          if (matched.length > 0) {
            console.log(
              chalk.gray(`  规则 "${pattern}" 匹配到 ${matched.length} 个文件`)
            );
            templateFiles.push(...matched);
          } else {
            console.log(chalk.yellow(`  ⚠ 规则 "${pattern}" 未匹配到任何文件`));
          }
        } else {
          // 精确匹配文件
          const fullPath = path.join(templatesDir, pattern);
          try {
            await fs.access(fullPath);
            templateFiles.push(fullPath);
            console.log(chalk.gray(`  找到文件: ${pattern}`));
          } catch (error) {
            console.log(chalk.yellow(`  ⚠ 文件不存在: ${pattern}`));
          }
        }
      }

      // 去重
      templateFiles = [...new Set(templateFiles)];
    } else {
      // 递归读取目录下所有 .html 文件
      templateFiles = await this.getHtmlFilesRecursively(templatesDir);
    }

    console.log(chalk.green(`✓ 找到 ${templateFiles.length} 个邮件模板`));
    templateFiles.forEach((file) => {
      const relativePath = path.relative(templatesDir, file);
      console.log(chalk.gray(`  - ${relativePath}`));
    });

    return templateFiles;
  }

  /**
   * 读取邮件模板内容
   */
  async readTemplate(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      console.log(chalk.red(`✗ 读取模板失败: ${path.basename(filePath)}`));
      console.log(chalk.red(`  错误: ${error.message}`));
      return null;
    }
  }

  /**
   * 发送单封邮件（带重试）
   */
  async sendEmail(recipient, subject, html, retryCount = 0) {
    const mailOptions = {
      from: `"${config.from.name}" <${config.from.email}>`,
      to: recipient,
      subject,
      html,
      // 添加更多邮件头以提高送达率
      replyTo: config.replyTo
        ? `"${config.replyTo.name}" <${config.replyTo.email}>`
        : undefined,
      // 添加邮件头信息
      headers: {
        "X-Mailer": "NodeMailer",
        "X-Priority": "3",
        Importance: "Normal",
      },
      // 同时发送纯文本版本（提高送达率）
      text: this.htmlToText(html),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, info };
    } catch (error) {
      if (retryCount < config.sendOptions.retryTimes) {
        console.log(
          chalk.yellow(
            `  ⟳ 重试 (${retryCount + 1}/${
              config.sendOptions.retryTimes
            }): ${recipient}`
          )
        );
        await this.delay(config.sendOptions.retryDelay);
        return this.sendEmail(recipient, subject, html, retryCount + 1);
      }
      return { success: false, error };
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 简单的 HTML 转纯文本（用于邮件的 text 版本）
   */
  htmlToText(html) {
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
   * 批量发送邮件
   */
  async sendBatch() {
    const templateFiles = await this.getTemplateFiles();

    if (templateFiles.length === 0) {
      console.log(chalk.yellow("\n⚠ 没有找到邮件模板，退出程序"));
      return;
    }

    if (config.recipients.length === 0) {
      console.log(chalk.yellow("\n⚠ 没有配置收件人，退出程序"));
      return;
    }

    console.log(chalk.blue("\n📮 开始发送邮件..."));
    console.log(chalk.gray(`  收件人数量: ${config.recipients.length}`));
    console.log(chalk.gray(`  模板数量: ${templateFiles.length}`));
    console.log(
      chalk.gray(
        `  总计: ${config.recipients.length * templateFiles.length} 封邮件\n`
      )
    );

    this.stats.total = config.recipients.length * templateFiles.length;

    for (const templateFile of templateFiles) {
      const templateName = path.basename(templateFile, ".html");
      const htmlContent = await this.readTemplate(templateFile);

      if (!htmlContent) {
        this.stats.failed += config.recipients.length;
        continue;
      }

      console.log(chalk.cyan(`\n📄 发送模板: ${templateName}`));
      console.log(chalk.gray("─".repeat(60)));

      for (const recipient of config.recipients) {
        const subject = `${templateName} - 测试邮件`;

        console.log(chalk.gray(`  → ${recipient}...`));

        const result = await this.sendEmail(recipient, subject, htmlContent);

        if (result.success) {
          this.stats.success++;
          console.log(chalk.green(`  ✓ 发送成功`));
        } else {
          this.stats.failed++;
          this.stats.failedList.push({
            recipient,
            template: templateName,
            error: result.error.message,
          });
          console.log(chalk.red(`  ✗ 发送失败: ${result.error.message}`));
        }

        // 发送间隔
        if (config.sendOptions.delay > 0) {
          await this.delay(config.sendOptions.delay);
        }
      }
    }

    this.printSummary();
  }

  /**
   * 打印发送统计
   */
  printSummary() {
    console.log(chalk.blue("\n" + "═".repeat(60)));
    console.log(chalk.bold.blue("📊 发送统计"));
    console.log(chalk.blue("═".repeat(60)));
    console.log(chalk.gray(`  总计: ${this.stats.total} 封`));
    console.log(chalk.green(`  成功: ${this.stats.success} 封`));
    console.log(chalk.red(`  失败: ${this.stats.failed} 封`));
    console.log(
      chalk.gray(
        `  成功率: ${((this.stats.success / this.stats.total) * 100).toFixed(
          2
        )}%`
      )
    );

    if (this.stats.failedList.length > 0) {
      console.log(chalk.red("\n失败详情:"));
      this.stats.failedList.forEach((item, index) => {
        console.log(
          chalk.red(`  ${index + 1}. ${item.recipient} - ${item.template}`)
        );
        console.log(chalk.gray(`     错误: ${item.error}`));
      });
    }

    console.log(chalk.blue("═".repeat(60)));
    console.log(chalk.green("\n✅ 邮件已真实发送到收件人邮箱"));
  }

  /**
   * 运行
   */
  async run() {
    console.log(chalk.bold.blue("\n🚀 邮件批量发送系统\n"));

    const connected = await this.init();
    if (!connected) {
      process.exit(1);
    }

    await this.sendBatch();
  }
}

// 运行程序
const sender = new EmailSender();
sender.run().catch((error) => {
  console.log(chalk.red("\n✗ 程序错误:"));
  console.log(chalk.red(error.stack));
  process.exit(1);
});
