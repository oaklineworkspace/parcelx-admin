import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const EMAIL_TEMPLATES = {
  booking_confirmed: {
    subject: 'Your Flight Booking is Confirmed - {booking_reference}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">ParcelX Flights</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Booking Confirmed!</h2>
          <p>Dear Customer,</p>
          <p>Great news! Your flight booking has been <strong style="color: #059669;">confirmed</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Booking Reference:</td>
                <td style="padding: 8px 0; font-weight: bold;">{booking_reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Departure Date:</td>
                <td style="padding: 8px 0;">{departure_date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Cabin Class:</td>
                <td style="padding: 8px 0;">{cabin_class}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Passengers:</td>
                <td style="padding: 8px 0;">{total_passengers}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Total Amount:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #059669;">$` + `{total_price}</td>
              </tr>
            </table>
          </div>
          
          <p>Please keep this email for your records. You will receive your e-ticket shortly.</p>
          <p>Thank you for choosing ParcelX Flights!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
        <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 ParcelX Flights. All rights reserved.</p>
        </div>
      </div>
    `,
  },
  payment_approved: {
    subject: 'Payment Confirmed - {booking_reference}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">ParcelX Flights</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Payment Approved!</h2>
          <p>Dear Customer,</p>
          <p>Your payment has been <strong style="color: #059669;">successfully verified and approved</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Booking Reference:</td>
                <td style="padding: 8px 0; font-weight: bold;">{booking_reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #059669;">$` + `{total_price}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Payment Method:</td>
                <td style="padding: 8px 0;">{payment_method}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Status:</td>
                <td style="padding: 8px 0;"><span style="background: #059669; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">PAID</span></td>
              </tr>
            </table>
          </div>
          
          <p>Your booking is now fully confirmed. Thank you for your payment!</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
        <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 ParcelX Flights. All rights reserved.</p>
        </div>
      </div>
    `,
  },
  booking_cancelled: {
    subject: 'Booking Cancelled - {booking_reference}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">ParcelX Flights</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Booking Cancelled</h2>
          <p>Dear Customer,</p>
          <p>We regret to inform you that your booking has been <strong style="color: #dc2626;">cancelled</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Booking Reference:</td>
                <td style="padding: 8px 0; font-weight: bold;">{booking_reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Status:</td>
                <td style="padding: 8px 0;"><span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">CANCELLED</span></td>
              </tr>
            </table>
          </div>
          
          <p>If you believe this was done in error or need assistance, please contact our support team immediately.</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            We apologize for any inconvenience caused.
          </p>
        </div>
        <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 ParcelX Flights. All rights reserved.</p>
        </div>
      </div>
    `,
  },
  payment_rejected: {
    subject: 'Payment Issue - {booking_reference}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">ParcelX Flights</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Payment Verification Issue</h2>
          <p>Dear Customer,</p>
          <p>Unfortunately, we were <strong style="color: #dc2626;">unable to verify your payment</strong> for the following booking.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Booking Reference:</td>
                <td style="padding: 8px 0; font-weight: bold;">{booking_reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Amount Due:</td>
                <td style="padding: 8px 0; font-weight: bold;">$` + `{total_price}</td>
              </tr>
            </table>
          </div>
          
          <p>Please re-submit your payment proof or contact our support team for assistance.</p>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Your booking will remain pending until payment is verified.
          </p>
        </div>
        <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 ParcelX Flights. All rights reserved.</p>
        </div>
      </div>
    `,
  },
}

function replaceTemplateVars(template, data) {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
  }
  return result
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, type, booking } = req.body

  if (!to || !type || !booking) {
    return res.status(400).json({ error: 'Missing required fields: to, type, booking' })
  }

  const template = EMAIL_TEMPLATES[type]
  if (!template) {
    return res.status(400).json({ error: `Unknown email type: ${type}` })
  }

  const templateData = {
    booking_reference: booking.booking_reference,
    departure_date: booking.departure_date,
    return_date: booking.return_date || 'N/A',
    cabin_class: booking.cabin_class?.charAt(0).toUpperCase() + booking.cabin_class?.slice(1),
    total_passengers: booking.total_passengers,
    total_price: Number(booking.total_price).toFixed(2),
    payment_method: booking.payment_crypto_name 
      ? `${booking.payment_crypto_name} (${booking.payment_network_type})` 
      : 'Crypto',
  }

  const subject = replaceTemplateVars(template.subject, templateData)
  const html = replaceTemplateVars(template.html, templateData)

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_FLIGHTS || process.env.SMTP_USER,
      to,
      subject,
      html,
    })

    return res.status(200).json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Email send error:', error)
    return res.status(500).json({ error: 'Failed to send email', details: error.message })
  }
}
