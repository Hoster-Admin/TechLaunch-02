const { Resend } = require('resend');

const resend    = new Resend(process.env.RESEND_API_KEY);
const FROM      = process.env.RESEND_FROM_EMAIL || 'TechLaunch MENA <hello@tlmena.com>';
const APP_URL   = process.env.APP_URL   || 'https://tlmena.com';
const ADMIN_URL = process.env.ADMIN_URL || ('https://' + (process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'));
const LOGO_URL  = `${ADMIN_URL}/logo-icon.png`;

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

/* ═══════════════════════════════════════════════════════════════
   1. WELCOME — user self-registers on the public site
   Design: Warm, celebratory. Red gradient accent, clean card.
═══════════════════════════════════════════════════════════════ */
const welcomeHtml = (name) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Welcome</title></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;">
<tr><td align="center" style="padding:48px 16px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:500px;">

  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:24px;">
    <img src="${LOGO_URL}" alt="TechLaunch MENA" width="56" height="56" style="display:block;border-radius:14px;border:0;"/>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

    <!-- Red accent bar + headline -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px 40px 32px;border-bottom:4px solid #E15033;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#E15033;letter-spacing:1.4px;text-transform:uppercase;">Welcome aboard</p>
        <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;line-height:1.2;">Hey ${name}, you're in!</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:32px 40px 40px;">
        <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.7;">
          Your <strong style="color:#111827;">TechLaunch MENA</strong> account is ready. Start discovering products, following founders, and connecting with the MENA startup ecosystem.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="background:#E15033;border-radius:10px;">
            <a href="${APP_URL}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">Explore Now →</a>
          </td></tr>
        </table>
      </td></tr>
    </table>

  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:24px 0 0;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} TechLaunch MENA &nbsp;·&nbsp; <a href="mailto:hello@tlmena.com" style="color:#9ca3af;text-decoration:none;">hello@tlmena.com</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

/* ═══════════════════════════════════════════════════════════════
   2. PUBLIC SITE INVITATION — admin invites a regular user
   Design: Light, open. Minimal with a centered invitation feel.
═══════════════════════════════════════════════════════════════ */
const publicInviteHtml = (name, activationLink) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>You're invited</title></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;">
<tr><td align="center" style="padding:48px 16px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:500px;">

  <!-- Card -->
  <tr><td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

      <!-- Top: logo centred with border bottom -->
      <tr><td align="center" style="padding:36px 40px 28px;border-bottom:1px solid #f3f4f6;">
        <img src="${LOGO_URL}" alt="TechLaunch MENA" width="48" height="48" style="display:block;border-radius:12px;border:0;margin:0 auto 14px;"/>
        <p style="margin:0;font-size:13px;color:#9ca3af;font-weight:600;letter-spacing:0.5px;">TechLaunch MENA</p>
      </td></tr>

      <!-- Invitation message -->
      <tr><td style="padding:36px 40px 40px;text-align:center;">
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.4px;">You've been invited,<br/>${name}!</h1>
        <p style="margin:0 0 36px;font-size:15px;color:#6b7280;line-height:1.6;">
          Someone has invited you to join <strong style="color:#111827;">TechLaunch MENA</strong>.<br/>Set up your account to get started.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
          <tr><td style="background:#111827;border-radius:10px;">
            <a href="${activationLink}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">Set Up My Account →</a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:12px;color:#9ca3af;">This link expires in <strong>72 hours</strong>.</p>
      </td></tr>

    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:24px 0 0;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} TechLaunch MENA &nbsp;·&nbsp; <a href="mailto:hello@tlmena.com" style="color:#9ca3af;text-decoration:none;">hello@tlmena.com</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

/* ═══════════════════════════════════════════════════════════════
   3. ADMIN PORTAL INVITATION — team member with a role
   Design: Dark, authoritative. Black header, role badge, formal.
═══════════════════════════════════════════════════════════════ */
const adminInviteHtml = (name, role, activationLink) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const roleDesc = {
    admin:     'Full access — manage the platform, team, settings, and all content.',
    moderator: 'Review and approve products, manage users, and moderate activity.',
    editor:    'Create and manage featured content across the platform.',
  }[role] || 'Access the TechLaunch MENA team panel.';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Team Invitation</title></head>
<body style="margin:0;padding:0;background:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#18181b;">
<tr><td align="center" style="padding:48px 16px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:500px;">

  <!-- Header -->
  <tr><td align="center" style="padding-bottom:28px;">
    <img src="${LOGO_URL}" alt="TechLaunch MENA" width="56" height="56" style="display:block;border-radius:14px;border:0;margin:0 auto 16px;"/>
    <p style="margin:0;font-size:13px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1.2px;text-transform:uppercase;">Team Invitation</p>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#27272a;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

      <!-- Name + role -->
      <tr><td style="padding:36px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <h1 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;">Welcome to the team,<br/>${name}!</h1>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="background:#E15033;border-radius:100px;padding:5px 14px;">
            <span style="font-size:12px;font-weight:700;color:#fff;letter-spacing:0.5px;">${roleLabel}</span>
          </td></tr>
        </table>
      </td></tr>

      <!-- Role description -->
      <tr><td style="padding:24px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1px;text-transform:uppercase;">Your access</p>
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.6;">${roleDesc}</p>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:32px 40px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
          <tr><td style="background:#E15033;border-radius:10px;">
            <a href="${activationLink}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">Activate My Account →</a>
          </td></tr>
        </table>
        <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.3);">Link expires in 72 hours &nbsp;·&nbsp; Do not share this link</p>
        <p style="margin:0;font-size:11px;word-break:break-all;">
          <a href="${activationLink}" style="color:#E15033;text-decoration:none;">${activationLink}</a>
        </p>
      </td></tr>

    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:24px 0 0;">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);">© ${new Date().getFullYear()} TechLaunch MENA &nbsp;·&nbsp; <a href="mailto:hello@tlmena.com" style="color:rgba(255,255,255,0.2);text-decoration:none;">hello@tlmena.com</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
};

/* ═══════════════════════════════════════════════════════════════
   Exported senders
═══════════════════════════════════════════════════════════════ */
const sendWelcomeEmail = ({ to, name }) =>
  send(to, `Welcome to TechLaunch MENA, ${name}!`, welcomeHtml(name), 'welcome');

const sendPublicInvitationEmail = ({ to, name, activationLink }) =>
  send(to, `You've been invited to join TechLaunch MENA`, publicInviteHtml(name, activationLink), 'public-invite');

const sendAdminCreatedAccountEmail = ({ to, name, role, activationLink }) => {
  const isTeam = role !== 'user';
  return isTeam
    ? send(to, `You've been invited to the TechLaunch MENA team`, adminInviteHtml(name, role, activationLink), 'admin-invite')
    : send(to, `You've been invited to join TechLaunch MENA`, publicInviteHtml(name, activationLink), 'public-invite');
};

const sendApprovalEmail = ({ to, founderName, productName, productSlug, note }) => {
  const productUrl = `${APP_URL}/products/${productSlug || ''}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Product Approved</title></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;">
<tr><td align="center" style="padding:48px 16px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:500px;">
  <tr><td align="center" style="padding-bottom:24px;">
    <img src="${LOGO_URL}" alt="TechLaunch MENA" width="56" height="56" style="display:block;border-radius:14px;border:0;"/>
  </td></tr>
  <tr><td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:40px 40px 32px;border-bottom:4px solid #16a34a;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#16a34a;letter-spacing:1.4px;text-transform:uppercase;">🎉 Congratulations!</p>
        <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;line-height:1.2;">${productName} is now live!</h1>
      </td></tr>
      <tr><td style="padding:32px 40px 40px;">
        <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.7;">Hi ${founderName}, your product <strong style="color:#111827;">${productName}</strong> has been approved and is now visible on TechLaunch MENA.</p>
        ${note ? `<div style="margin:0 0 24px;padding:16px 20px;background:#f0fdf4;border-radius:10px;border-left:4px solid #16a34a;"><p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.08em;">Note from our team</p><p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${note}</p></div>` : ''}
        <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">Share your listing with your network and start collecting upvotes. The more visibility you get, the higher you'll rank.</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="background:#16a34a;border-radius:10px;">
            <a href="${productUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">View Your Live Listing →</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  return send(to, `🎉 ${productName} is now live on Tech Launch!`, html, 'product-approval');
};

module.exports = { sendWelcomeEmail, sendPublicInvitationEmail, sendAdminCreatedAccountEmail, sendApprovalEmail };
