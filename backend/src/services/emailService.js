const { Resend } = require('resend');

const resend   = new Resend(process.env.RESEND_API_KEY);
const FROM     = process.env.RESEND_FROM_EMAIL || 'TechLaunch MENA <hello@tlmena.com>';
const APP_URL  = process.env.APP_URL || 'https://tlmena.com';
const LOGO_URL = `${APP_URL}/logo.png`;

const shell = (preheader, body) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>TechLaunch MENA</title>
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</span>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
  <tr><td align="center" style="padding:40px 16px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;">

      <!-- Logo -->
      <tr>
        <td align="center" style="padding-bottom:20px;">
          <img src="${LOGO_URL}" alt="TechLaunch MENA" height="44" style="display:block;border:0;"/>
        </td>
      </tr>

      <!-- Card -->
      <tr>
        <td style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
          ${body}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td align="center" style="padding:20px 0 4px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            &copy; ${new Date().getFullYear()} TechLaunch MENA &nbsp;&middot;&nbsp;
            <a href="mailto:hello@tlmena.com" style="color:#9ca3af;text-decoration:none;">hello@tlmena.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

const btn = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="border-radius:10px;background:#E15033;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">${label}</a>
    </td>
  </tr>
</table>`;

/* ─────────────────────────────────────────────────────────────
   1. WELCOME — user self-registers on the public site
───────────────────────────────────────────────────────────── */
const welcomeUserEmail = (name) => shell(
  `Welcome to TechLaunch MENA, ${name}!`,
  `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="background:#E15033;padding:36px 40px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">Welcome, ${name}!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px;text-align:center;">
        <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
          Your account is ready. Discover, upvote, and launch products from across the Arab world.
        </p>
        ${btn(APP_URL, 'Start Exploring →')}
      </td>
    </tr>
  </table>`
);

/* ─────────────────────────────────────────────────────────────
   2. PUBLIC SITE INVITATION — admin invites a user to the public site
───────────────────────────────────────────────────────────── */
const publicInvitationEmail = (name, activationLink) => shell(
  `You've been invited to TechLaunch MENA — set up your account to get started.`,
  `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding:40px 40px 32px;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#E15033;letter-spacing:1.2px;text-transform:uppercase;">You've been invited</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#111827;line-height:1.3;">Join TechLaunch MENA, ${name}!</h1>
        <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
          Click the button below to set up your password and activate your account.
        </p>
        ${btn(activationLink, 'Set Up My Account →')}
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Link expires in 72 hours.</p>
      </td>
    </tr>
  </table>`
);

/* ─────────────────────────────────────────────────────────────
   3. ADMIN PORTAL INVITATION — admin invites a team member with a role
───────────────────────────────────────────────────────────── */
const adminInvitationEmail = (name, role, activationLink) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const roleDesc = {
    admin:     'Full access to manage the platform, team, settings, and all content.',
    moderator: 'Review and approve products, manage users, and oversee platform activity.',
    editor:    'Create and manage featured content and platform posts.',
  }[role] || 'Access the TechLaunch MENA admin panel.';

  return shell(
    `You've been invited to the TechLaunch MENA team as ${roleLabel}.`,
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="background:#0a0a0a;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);letter-spacing:1.2px;text-transform:uppercase;">Team Invitation</p>
          <h1 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">Welcome, ${name}!</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:100px;padding:5px 14px;">
                <span style="font-size:13px;font-weight:600;color:#ffffff;">${roleLabel}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;text-align:center;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            You've been added to the <strong>TechLaunch MENA</strong> admin team.<br/>
            <span style="font-size:13px;color:#6b7280;">${roleDesc}</span>
          </p>
          ${btn(activationLink, 'Activate My Account →')}
          <p style="margin:20px 0 4px;font-size:12px;color:#9ca3af;">Link expires in 72 hours.</p>
          <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;word-break:break-all;">
            <a href="${activationLink}" style="color:#E15033;text-decoration:none;">${activationLink}</a>
          </p>
        </td>
      </tr>
    </table>`
  );
};

/* ─────────────────────────────────────────────────────────────
   Senders
───────────────────────────────────────────────────────────── */
const send = async (to, subject, html, tag) => {
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error(`[Email] ${tag} error:`, error);
    else console.log(`[Email] ${tag} sent to`, to, '| id:', data.id);
    return { success: !error, error };
  } catch (err) {
    console.error(`[Email] ${tag} exception:`, err.message);
    return { success: false, error: err };
  }
};

const sendWelcomeEmail = ({ to, name }) =>
  send(to, `Welcome to TechLaunch MENA, ${name}!`, welcomeUserEmail(name), 'welcome');

const sendPublicInvitationEmail = ({ to, name, activationLink }) =>
  send(to, `You've been invited to join TechLaunch MENA`, publicInvitationEmail(name, activationLink), 'public-invite');

const sendAdminCreatedAccountEmail = ({ to, name, role, activationLink }) => {
  const isTeam = role !== 'user';
  return isTeam
    ? send(to, `You've been invited to the TechLaunch MENA team`, adminInvitationEmail(name, role, activationLink), 'admin-invite')
    : send(to, `You've been invited to join TechLaunch MENA`, publicInvitationEmail(name, activationLink), 'public-invite');
};

module.exports = { sendWelcomeEmail, sendPublicInvitationEmail, sendAdminCreatedAccountEmail };
