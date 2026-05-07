import nodemailer from "nodemailer";
import { AppError } from "../utils/AppError";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  // Initialize email transporter
  private static getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    // Get email configuration from environment variables
    const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
    const emailPort = parseInt(process.env.EMAIL_PORT || "587");
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      throw new AppError(
        "Email configuration not found. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.",
        500
      );
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    return this.transporter;
  }

  // Send email
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = this.getTransporter();
      const fromEmail = process.env.EMAIL_USER || "noreply@guardcrm.com";

      await transporter.sendMail({
        from: `Guard CRM <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      throw new AppError(
        `Failed to send email: ${error.message}`,
        500
      );
    }
  }

  // Send bill via email
  static async sendBillEmail(
    recipientEmail: string,
    billData: any,
    pdfBuffer?: Buffer,
    customMessage?: string
  ): Promise<void> {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const monthName = monthNames[billData.month - 1];
    const subject = `Bill for ${billData.projectName} - ${monthName} ${billData.year}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #2563eb;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
            }
            .bill-details {
              background-color: white;
              padding: 15px;
              margin: 15px 0;
              border-radius: 5px;
            }
            .total {
              background-color: #2563eb;
              color: white;
              padding: 15px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              border-radius: 5px;
              margin-top: 15px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Guard CRM - Bill</h1>
            </div>
            <div class="content">
              ${customMessage ? `<p>${customMessage}</p>` : ""}
              
              <div class="bill-details">
                <h2>Bill Details</h2>
                <p><strong>Bill Number:</strong> ${billData.billNumber}</p>
                <p><strong>Project:</strong> ${billData.projectName}</p>
                <p><strong>Site:</strong> ${billData.siteName}</p>
                <p><strong>Address:</strong> ${billData.siteAddress}, ${billData.siteCity}</p>
                <p><strong>Billing Period:</strong> ${new Date(billData.billingPeriod.startDate).toLocaleDateString()} - ${new Date(billData.billingPeriod.endDate).toLocaleDateString()}</p>
              </div>

              <h3>Guard Assignments</h3>
              <table>
                <thead>
                  <tr>
                    <th>Guard Name</th>
                    <th>Shift Type</th>
                    <th>Days Worked</th>
                    <th>Monthly Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${billData.guardAssignments
                    .map(
                      (assignment: any) => `
                    <tr>
                      <td>${assignment.guardName}</td>
                      <td>${assignment.shiftType}</td>
                      <td>${assignment.daysWorked}</td>
                      <td>₹${assignment.monthlyRate.toLocaleString("en-IN")}</td>
                      <td>₹${assignment.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <div class="bill-details">
                <p><strong>Subtotal:</strong> ₹${billData.subtotal.toLocaleString("en-IN")}</p>
                ${billData.tax ? `<p><strong>Tax (${billData.tax}%):</strong> ₹${((billData.subtotal * billData.tax) / 100).toLocaleString("en-IN")}</p>` : ""}
              </div>

              <div class="total">
                Total Amount: ₹${billData.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>
            <div class="footer">
              <p>This is an automated email from Guard CRM.</p>
              <p>Please contact us if you have any questions.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailOptions: EmailOptions = {
      to: recipientEmail,
      subject,
      html,
    };

    if (pdfBuffer) {
      emailOptions.attachments = [
        {
          filename: `Bill_${billData.billNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    await this.sendEmail(emailOptions);
  }
}

