const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM_EMAIL || 'TechLaunch MENA <hello@tlmena.com>';
const APP_URL = process.env.APP_URL || 'https://tlmena.com';

const baseTemplate = (preheader, bodyContent) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>TechLaunch MENA</title>
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;">
  <tr><td align="center" style="padding:40px 16px;">

    <!-- Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

      <!-- Logo bar -->
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#0a0a0a;border-radius:12px;padding:10px 14px;vertical-align:middle;">
                <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">TL</span>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <span style="font-size:18px;font-weight:800;color:#0a0a0a;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">TechLaunch MENA</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main card -->
      <tr>
        <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.06);">
          ${bodyContent}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td align="center" style="padding:28px 0 8px;">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
            © ${new Date().getFullYear()} TechLaunch MENA · MENA's Product Discovery Platform
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            <a href="${APP_URL}" style="color:#9ca3af;text-decoration:underline;">tlmena.com</a>
            &nbsp;·&nbsp;
            <a href="mailto:hello@tlmena.com" style="color:#9ca3af;text-decoration:underline;">hello@tlmena.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

const divider = `<tr><td style="padding:0 40px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>`;

const ctaButton = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="border-radius:10px;background:#E15033;">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;

const featureRow = (icon, title, desc) => `
<tr>
  <td style="padding:12px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width:40px;vertical-align:top;padding-top:2px;font-size:20px;">${icon}</td>
        <td style="vertical-align:top;padding-left:12px;">
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#111827;">${title}</p>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

const welcomeUserEmail = (name, handle) => baseTemplate(
  `Welcome to TechLaunch MENA, ${name}! You're now part of MENA's premier startup community.`,
  `
  <!-- Header strip -->
  <tr>
    <td style="background:linear-gradient(135deg,#E15033 0%,#b83418 100%);padding:48px 40px 40px;text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:1.5px;text-transform:uppercase;">Welcome to the community</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;">
        Great to have you,<br/>${name}!
      </h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:40px 40px 8px;">
      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
        Your account is ready. You're now part of <strong>TechLaunch MENA</strong> — the platform where founders, investors, and builders across the Arab world discover, launch, and grow the next generation of startups.
      </p>
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">Your handle</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="background:#fef3f0;border:1.5px solid #fcd4c8;border-radius:8px;padding:10px 16px;">
            <span style="font-size:15px;font-weight:700;color:#E15033;">@${handle}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${divider}

  <!-- Features -->
  <tr>
    <td style="padding:32px 40px 8px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">What you can do</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${featureRow('🚀', 'Launch your product', 'Submit your startup and get discovered by thousands of early adopters across MENA.')}
        ${featureRow('🤝', 'Connect with investors', 'Pitch directly to active MENA-focused VCs and angel investors.')}
        ${featureRow('🏢', 'Find accelerators', 'Apply to top MENA accelerators and venture studios in one place.')}
        ${featureRow('🔍', 'Explore the ecosystem', 'Discover what founders and makers are building across the region.')}
      </table>
    </td>
  </tr>

  ${divider}

  <!-- CTA -->
  <tr>
    <td style="padding:36px 40px 40px;text-align:center;">
      ${ctaButton(`${APP_URL}`, 'Start Exploring →')}
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
        Or visit: <a href="${APP_URL}" style="color:#E15033;text-decoration:none;">${APP_URL}</a>
      </p>
    </td>
  </tr>
  `
);

const invitationEmail = (name, role, activationLink) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const roleDescriptions = {
    admin:     'Full access to manage the platform, team, settings, and all content.',
    moderator: 'Review and approve products, manage users, and oversee platform activity.',
    editor:    'Create and manage featured content and platform posts.',
    user:      'Access the platform as a community member.',
  };
  const roleDesc = roleDescriptions[role] || 'Access the TechLaunch MENA platform.';

  return baseTemplate(
    `You've been invited to join TechLaunch MENA as a ${roleLabel}. Activate your account to get started.`,
    `
    <!-- Header strip -->
    <tr>
      <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1f1f1f 100%);padding:48px 40px 40px;text-align:center;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:1.5px;text-transform:uppercase;">You've been invited</p>
        <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;">
          Welcome to the team,<br/>${name}!
        </h1>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto 0;">
          <tr>
            <td style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:100px;padding:6px 16px;">
              <span style="font-size:13px;font-weight:600;color:#ffffff;">${roleLabel}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:40px 40px 8px;">
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
          The <strong>TechLaunch MENA</strong> team has added you to the platform. Click the button below to activate your account and set your own password — it only takes a minute.
        </p>

        <!-- Role card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">Your role</p>
              <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111827;">${roleLabel}</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${roleDesc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${divider}

    <!-- Expiry notice -->
    <tr>
      <td style="padding:24px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:18px;vertical-align:top;padding-right:12px;">⏱</td>
                  <td>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#92400e;">Link expires in 72 hours</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#b45309;line-height:1.5;">If you don't activate within 72 hours, ask your admin to resend the invitation.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:8px 40px 40px;text-align:center;">
        ${ctaButton(activationLink, 'Activate My Account →')}
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Button not working? Copy and paste this link:</p>
        <p style="margin:6px 0 0;font-size:11px;color:#6b7280;word-break:break-all;">
          <a href="${activationLink}" style="color:#E15033;text-decoration:none;">${activationLink}</a>
        </p>
      </td>
    </tr>

    ${divider}

    <!-- About platform -->
    <tr>
      <td style="padding:28px 40px 36px;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">About TechLaunch MENA</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          ${featureRow('🌍', 'MENA\'s Product Discovery Hub', 'The go-to platform for founders, investors, and makers across the Arab world.')}
          ${featureRow('📦', 'Product Launches', 'Hundreds of startups launch and get discovered on our platform every month.')}
          ${featureRow('💼', 'Investor & Accelerator Network', 'Direct connections to leading MENA-focused VCs, angels, and accelerators.')}
        </table>
      </td>
    </tr>
    `
  );
};

const sendWelcomeEmail = async ({ to, name, handle }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Welcome to TechLaunch MENA, ${name}!`,
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

const sendAdminCreatedAccountEmail = async ({ to, name, role, activationLink }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `You've been invited to join TechLaunch MENA`,
      html: invitationEmail(name, role, activationLink),
    });
    if (error) console.error('[Email] sendAdminCreatedAccountEmail error:', error);
    else console.log('[Email] Invitation email sent to', to, '| id:', data.id);
    return { success: !error, error };
  } catch (err) {
    console.error('[Email] sendAdminCreatedAccountEmail exception:', err.message);
    return { success: false, error: err };
  }
};

module.exports = { sendWelcomeEmail, sendAdminCreatedAccountEmail };
