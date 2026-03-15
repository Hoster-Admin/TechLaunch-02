const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'TLMena <noreply@tlmena.com>';
const APP_URL = process.env.CLIENT_URL || 'https://tlmena.com';

const sendWelcomeEmail = async ({ name, email }) => {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Welcome to TLMena 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 16px;">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#E15033;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">TLMena</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">The MENA Tech Launch Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Welcome aboard, ${name}! 👋</h2>
                    <p style="margin:0 0 16px;color:#555;line-height:1.6;font-size:15px;">
                      You're now part of the MENA tech community. Discover startups, connect with founders, and launch your own projects.
                    </p>
                    <p style="margin:0 0 32px;color:#555;line-height:1.6;font-size:15px;">
                      Here's what you can do right now:
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr><td style="padding:8px 0;color:#555;font-size:15px;">🔍 &nbsp;Explore products from the region</td></tr>
                      <tr><td style="padding:8px 0;color:#555;font-size:15px;">🚀 &nbsp;Submit your own startup</td></tr>
                      <tr><td style="padding:8px 0;color:#555;font-size:15px;">🤝 &nbsp;Follow founders & investors</td></tr>
                    </table>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#E15033;border-radius:8px;">
                          <a href="${APP_URL}" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
                            Go to TLMena →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                    <p style="margin:0;color:#aaa;font-size:13px;">
                      © ${new Date().getFullYear()} TLMena · <a href="${APP_URL}" style="color:#aaa;">tlmena.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[email] sendWelcomeEmail failed:', err.message);
  }
};

const sendInviteEmail = async ({ name, email, token, role = 'user' }) => {
  const inviteUrl = `${APP_URL}/set-password?token=${token}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "You've been invited to TLMena",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 16px;">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#E15033;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">TLMena</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">The MENA Tech Launch Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#111;font-size:22px;">You're invited, ${name}! 🎉</h2>
                    <p style="margin:0 0 16px;color:#555;line-height:1.6;font-size:15px;">
                      An admin has created an account for you on TLMena as <strong>${role}</strong>.
                      Click the button below to set your password and activate your account.
                    </p>
                    <p style="margin:0 0 32px;color:#888;font-size:13px;">
                      This invite link expires in <strong>48 hours</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#E15033;border-radius:8px;">
                          <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
                            Set My Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;color:#aaa;font-size:12px;word-break:break-all;">
                      Or copy this link: ${inviteUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                    <p style="margin:0;color:#aaa;font-size:13px;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[email] sendInviteEmail failed:', err.message);
  }
};

const sendPasswordResetEmail = async ({ name, email, token }) => {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Reset your TLMena password',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 16px;">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#E15033;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">TLMena</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">The MENA Tech Launch Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Reset your password</h2>
                    <p style="margin:0 0 16px;color:#555;line-height:1.6;font-size:15px;">
                      Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.
                    </p>
                    <p style="margin:0 0 32px;color:#888;font-size:13px;">
                      This link expires in <strong>1 hour</strong>. If you didn't request a reset, you can safely ignore this email.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#E15033;border-radius:8px;">
                          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
                            Reset Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;color:#aaa;font-size:12px;word-break:break-all;">
                      Or copy this link: ${resetUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                    <p style="margin:0;color:#aaa;font-size:13px;">© ${new Date().getFullYear()} TLMena</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[email] sendPasswordResetEmail failed:', err.message);
  }
};

const sendSubmissionEmail = async ({ name, email, productName }) => {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `We received your submission — ${productName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 16px;">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#E15033;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">TLMena</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Submission received! ⏱</h2>
                    <p style="margin:0 0 16px;color:#555;line-height:1.6;font-size:15px;">
                      Hi ${name}, your product <strong>${productName}</strong> has been submitted and is now under review.
                    </p>
                    <p style="margin:0 0 32px;color:#555;line-height:1.6;font-size:15px;">
                      We'll notify you once it's been reviewed — usually within <strong>24 hours</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#E15033;border-radius:8px;">
                          <a href="${APP_URL}/settings?tab=products" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
                            View Submission Status →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                    <p style="margin:0;color:#aaa;font-size:13px;">© ${new Date().getFullYear()} TLMena</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[email] sendSubmissionEmail failed:', err.message);
  }
};

const sendApprovalEmail = async ({ name, email, productName, productId }) => {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `🎉 ${productName} is now live on Tech Launch!`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 16px;">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#E15033;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">TLMena</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Congratulations, ${name}! 🎉</h2>
                    <p style="margin:0 0 16px;color:#555;line-height:1.6;font-size:15px;">
                      Your product <strong>${productName}</strong> has been approved and is now live on Tech Launch MENA.
                    </p>
                    <p style="margin:0 0 32px;color:#555;line-height:1.6;font-size:15px;">
                      Share it with your network and start collecting upvotes from the MENA tech community!
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#E15033;border-radius:8px;">
                          <a href="${APP_URL}/products/${productId}" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
                            View Your Live Listing →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                    <p style="margin:0;color:#aaa;font-size:13px;">© ${new Date().getFullYear()} TLMena</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[email] sendApprovalEmail failed:', err.message);
  }
};

const sendRejectionEmail = async ({ name, email, productName, reason }) => {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Update on your submission — ${productName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:40px 16px;">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#E15033;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">TLMena</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#111;font-size:22px;">Update on your submission</h2>
                    <p style="margin:0 0 16px;color:#555;line-height:1.6;font-size:15px;">
                      Hi ${name}, thank you for submitting <strong>${productName}</strong>.
                    </p>
                    <p style="margin:0 0 16px;color:#555;line-height:1.6;font-size:15px;">
                      After review, we weren't able to approve this listing at this time.
                    </p>
                    ${reason ? `<div style="margin:0 0 24px;padding:16px;background:#fef2f2;border-radius:8px;border-left:4px solid #e63946;"><p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
                    <p style="margin:0 0 32px;color:#555;line-height:1.6;font-size:15px;">
                      You're welcome to make changes and resubmit. We look forward to seeing it again.
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#E15033;border-radius:8px;">
                          <a href="${APP_URL}/settings?tab=products" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
                            View My Submissions →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                    <p style="margin:0;color:#aaa;font-size:13px;">© ${new Date().getFullYear()} TLMena</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error('[email] sendRejectionEmail failed:', err.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendInviteEmail,
  sendPasswordResetEmail,
  sendSubmissionEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};
