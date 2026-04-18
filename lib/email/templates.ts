export function inviteEmail(opts: { inviterName: string; orgName: string; inviteUrl: string; role: string }) {
  return {
    subject: `You've been invited to join ${opts.orgName} on ZenOps`,
    html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;max-width:520px;margin:0 auto">
  <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
    <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 8px">ZenOps</h1>
    <p style="color:#94a3b8;margin:0 0 32px;font-size:14px">Front-office automation</p>
    <h2 style="font-size:18px;font-weight:600;color:#fff;margin:0 0 12px">You've been invited</h2>
    <p style="font-size:14px;color:#cbd5e1;margin:0 0 8px">
      <strong>${opts.inviterName}</strong> invited you to join <strong>${opts.orgName}</strong> on ZenOps as a <strong>${opts.role}</strong>.
    </p>
    <p style="font-size:14px;color:#94a3b8;margin:0 0 32px">This invitation expires in 7 days.</p>
    <a href="${opts.inviteUrl}" style="display:inline-block;background:#14b8a6;color:#0f172a;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none">
      Accept invitation →
    </a>
    <p style="font-size:12px;color:#475569;margin:32px 0 0">Or paste this URL: ${opts.inviteUrl}</p>
  </div>
</body></html>`,
  }
}

export function trialExpiringEmail(opts: { name: string; daysLeft: number; upgradeUrl: string }) {
  return {
    subject: `Your ZenOps trial ends in ${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}`,
    html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;max-width:520px;margin:0 auto">
  <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
    <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 32px">ZenOps</h1>
    <h2 style="font-size:18px;font-weight:600;color:#f59e0b;margin:0 0 12px">⏰ Trial ending soon</h2>
    <p style="font-size:14px;color:#cbd5e1;margin:0 0 8px">Hi ${opts.name},</p>
    <p style="font-size:14px;color:#cbd5e1;margin:0 0 24px">
      Your ZenOps free trial ends in <strong>${opts.daysLeft} day${opts.daysLeft !== 1 ? 's' : ''}</strong>.
      Upgrade now to keep your leads, automations, and team access.
    </p>
    <a href="${opts.upgradeUrl}" style="display:inline-block;background:#14b8a6;color:#0f172a;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none">
      Upgrade my plan →
    </a>
  </div>
</body></html>`,
  }
}

export function leadNotificationEmail(opts: { recipientName: string; leadName: string; leadEmail: string; leadPhone: string; dashboardUrl: string }) {
  return {
    subject: `New lead: ${opts.leadName}`,
    html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;max-width:520px;margin:0 auto">
  <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
    <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 32px">ZenOps</h1>
    <h2 style="font-size:18px;font-weight:600;color:#14b8a6;margin:0 0 12px">🎯 New lead added</h2>
    <p style="font-size:14px;color:#cbd5e1;margin:0 0 20px">Hi ${opts.recipientName}, a new lead was just added to your pipeline.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
      <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;width:80px">Name</td><td style="padding:8px 0;color:#e2e8f0;font-size:13px;font-weight:600">${opts.leadName}</td></tr>
      <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Email</td><td style="padding:8px 0;color:#e2e8f0;font-size:13px">${opts.leadEmail || '—'}</td></tr>
      <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Phone</td><td style="padding:8px 0;color:#e2e8f0;font-size:13px">${opts.leadPhone || '—'}</td></tr>
    </table>
    <a href="${opts.dashboardUrl}" style="display:inline-block;background:#14b8a6;color:#0f172a;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none">
      View in ZenOps →
    </a>
  </div>
</body></html>`,
  }
}

export function automationTriggeredEmail(opts: { recipientName: string; ruleName: string; message: string; dashboardUrl: string }) {
  return {
    subject: `ZenOps: ${opts.ruleName}`,
    html: `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px 20px;max-width:520px;margin:0 auto">
  <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px">
    <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 32px">ZenOps</h1>
    <h2 style="font-size:18px;font-weight:600;color:#818cf8;margin:0 0 12px">⚡ Automation triggered</h2>
    <p style="font-size:14px;color:#cbd5e1;margin:0 0 8px">Hi ${opts.recipientName},</p>
    <p style="font-size:14px;color:#cbd5e1;margin:0 0 8px"><strong>${opts.ruleName}</strong></p>
    <p style="font-size:14px;color:#94a3b8;margin:0 0 28px">${opts.message}</p>
    <a href="${opts.dashboardUrl}" style="display:inline-block;background:#14b8a6;color:#0f172a;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none">
      View dashboard →
    </a>
  </div>
</body></html>`,
  }
}
