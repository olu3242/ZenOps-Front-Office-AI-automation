import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.FROM_EMAIL ?? 'noreply@zenops.app'

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const { error } = await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html })
  if (error) throw new Error(`Email send failed: ${error.message}`)
}
