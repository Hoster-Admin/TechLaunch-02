const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'TechLaunch MENA <onboarding@resend.dev>';

const welcomeUserEmail = (name, handle) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to TechLaunch MENA</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E15033 0%,#c73e20 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">TechLaunch MENA</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">The Home of MENA's Boldest Startups</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:600;">Welcome aboard, ${name}! 🎉</h2>
            <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
              You're now part of the TechLaunch MENA community — the platform where founders, investors, and builders across the region discover and grow the next generation of startups.
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#fef7f5;border-left:4px solid #E15033;border-radius:0 8px 8px 0;width:100%;margin:0 0 24px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
                  Your handle is <strong style="color:#E15033;">@${handle}</strong>. You can now explore products, submit your startup, connect with investors, and join the conversation.
                </p>
              </td></tr>
            </table>
            <h3 style="margin:0 0 14px;color:#111827;font-size:16px;font-weight:600;">Here's what you can do next:</h3>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
              <tr>
                <td style="padding:8px 0;color:#374151;font-size:14px;">🚀 &nbsp;<strong>Submit your product</strong> — get discovered by thousands of early adopters</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#374151;font-size:14px;">🤝 &nbsp;<strong>Connect with investors</strong> — pitch to active MENA-focused VCs</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#374151;font-size:14px;">🔍 &nbsp;<strong>Explore the ecosystem</strong> — find accelerators, studios, and fellow founders</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 32px;">
              <tr><td align="center">
                <a href="${process.env.APP_URL || 'https://techlauchmena.com'}" style="display:inline-block;background:#E15033;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">Explore TechLaunch MENA →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              You received this email because you created an account on TechLaunch MENA.<br>
              © 2025 TechLaunch MENA. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const welcomeAdminCreatedEmail = (name, email, tempPassword, role) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your TechLaunch MENA Account</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E15033 0%,#c73e20 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">TechLaunch MENA</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your account has been created</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:600;">Hello, ${name}!</h2>
            <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
              An account has been created for you on <strong>TechLaunch MENA</strong> with the role of <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>. Use the credentials below to sign in for the first time.
            </p>
            <!-- Credentials box -->
            <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;width:100%;margin:0 0 28px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 14px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Your Login Credentials</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;width:100px;font-weight:600;">Email:</td>
                    <td style="padding:6px 0;color:#111827;font-size:14px;font-family:monospace;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#374151;font-size:14px;font-weight:600;">Password:</td>
                    <td style="padding:6px 0;">
                      <span style="background:#E15033;color:#ffffff;font-family:monospace;font-size:14px;padding:3px 10px;border-radius:5px;letter-spacing:1px;">${tempPassword}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;width:100%;margin:0 0 28px;">
              <tr><td style="padding:14px 18px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                  ⚠️ &nbsp;This is a temporary password. Please change it immediately after signing in for the first time.
                </p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 32px;">
              <tr><td align="center">
                <a href="${process.env.APP_URL || 'https://techlauchmena.com'}/login" style="display:inline-block;background:#E15033;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">Sign In Now →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              This account was created by the TechLaunch MENA team.<br>
              If you did not expect this email, please ignore it or contact support.<br>
              © 2025 TechLaunch MENA. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const sendWelcomeEmail = async ({ to, name, handle }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Welcome to TechLaunch MENA, ${name}! 🚀`,
      html: welcomeUserEmail(name, handle),
    });
    if (error) console.error('[Email] sendWelcomeEmail error:', error);
    else console.log('[Email] Welcome email sent to', to, '| id:', data.id);
    return { success: !error, error };
  } catch (err) {
    console.error('[Email] sendWelcomeEmail exception:', err.message);
    return { success: false, error: err };
  }
};

const sendAdminCreatedAccountEmail = async ({ to, name, email, tempPassword, role }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your TechLaunch MENA account is ready',
      html: welcomeAdminCreatedEmail(name, email, tempPassword, role),
    });
    if (error) console.error('[Email] sendAdminCreatedAccountEmail error:', error);
    else console.log('[Email] Admin-created account email sent to', to, '| id:', data.id);
    return { success: !error, error };
  } catch (err) {
    console.error('[Email] sendAdminCreatedAccountEmail exception:', err.message);
    return { success: false, error: err };
  }
};

module.exports = { sendWelcomeEmail, sendAdminCreatedAccountEmail };
