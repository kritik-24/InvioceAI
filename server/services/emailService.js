
const nodemailer = require("nodemailer");

const smtpPort = Number(process.env.BREVO_SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: smtpPort,
  secure:
    String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const verifyEmailTransporter = async () => {
  try {
    await transporter.verify();

    console.log("SMTP connection verified successfully.");
  } catch (error) {
    console.error(
      "SMTP connection verification failed:",
      error.message
    );
  }
};

const sendPasswordResetEmail = async ({
  email,
  name,
  resetUrl,
}) => {
  if (!email || !resetUrl) {
    throw new Error(
      "Email address and reset URL are required."
    );
  }

  const appName =
    process.env.APP_NAME || "InvoiceAI";

  const safeName = name || "there";

  const mailOptions = {
    from:
      process.env.SMTP_FROM ||
      `${appName} <${process.env.BREVO_SMTP_USER}>`,

    to: email,

    subject: `${appName} - Reset your password`,

    text: `
Hello ${safeName},

We received a request to reset your ${appName} password.

Use the link below to create a new password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
${appName}
`.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #080808;
    font-family: Arial, Helvetica, sans-serif;
    color: #ffffff;
  "
>
  <div
    style="
      width: 100%;
      padding: 40px 16px;
      box-sizing: border-box;
      background-color: #080808;
    "
  >
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        background-color: #111111;
        border: 1px solid #272727;
        border-radius: 16px;
        padding: 36px;
        box-sizing: border-box;
      "
    >
      <div
        style="
          text-align: center;
          margin-bottom: 30px;
        "
      >
        <span
          style="
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
          "
        >
          Invoice<span style="color: #818cf8;">AI</span>
        </span>
      </div>

      <h1
        style="
          margin: 0 0 16px;
          font-size: 24px;
          color: #ffffff;
        "
      >
        Reset your password
      </h1>

      <p
        style="
          margin: 0 0 16px;
          font-size: 15px;
          line-height: 1.7;
          color: #b3b3b3;
        "
      >
        Hello ${safeName},
      </p>

      <p
        style="
          margin: 0 0 24px;
          font-size: 15px;
          line-height: 1.7;
          color: #b3b3b3;
        "
      >
        We received a request to reset your ${appName} password.
        Click the button below to create a new password.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 13px 24px;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
          "
        >
          Reset Password
        </a>
      </div>

      <p
        style="
          margin: 24px 0 8px;
          font-size: 13px;
          line-height: 1.6;
          color: #777777;
        "
      >
        This password reset link will expire in 15 minutes.
      </p>

      <p
        style="
          margin: 0 0 20px;
          font-size: 13px;
          line-height: 1.6;
          color: #777777;
        "
      >
        If you did not request this password reset, you can safely
        ignore this email.
      </p>

      <div
        style="
          border-top: 1px solid #272727;
          padding-top: 20px;
          margin-top: 25px;
        "
      >
        <p
          style="
            margin: 0;
            font-size: 12px;
            color: #666666;
          "
        >
          This is an automated email from ${appName}.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log(
      `Password reset email sent to ${email}. Message ID: ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error(
      "Password reset email failed:",
      error.message
    );

    throw new Error(
      "Unable to send password reset email."
    );
  }
};

module.exports = {
  transporter,
  verifyEmailTransporter,
  sendPasswordResetEmail,
};