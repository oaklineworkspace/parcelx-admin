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
    subject: 'E-Ticket Receipt - {booking_reference}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: #2563eb; color: white; padding: 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">✈️ ParcelX Flights</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">E-TICKET RECEIPT</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #059669;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Booking Reference (PNR):</td>
                <td style="padding: 8px 0; font-weight: bold; font-size: 16px;">{booking_reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">E-Ticket Number:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #2563eb; font-size: 16px;">{eticket_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Booking Status:</td>
                <td style="padding: 8px 0;"><span style="background: #059669; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">CONFIRMED</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Issue Date:</td>
                <td style="padding: 8px 0;">{issue_date}</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">👤 Passenger Information</h3>
            {passengers_list}
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">✈️ Flight Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Airline:</td>
                <td style="padding: 8px 0; font-weight: bold;">{airline_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Flight Number:</td>
                <td style="padding: 8px 0; font-weight: bold;">{flight_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Class:</td>
                <td style="padding: 8px 0;">{cabin_class}</td>
              </tr>
            </table>
            
            <div style="display: flex; margin-top: 15px;">
              <div style="flex: 1; padding: 15px; background: #f0fdf4; border-radius: 8px; margin-right: 10px;">
                <p style="margin: 0 0 5px 0; color: #059669; font-weight: bold;">DEPARTURE</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">{departure_city} ({departure_code})</p>
                <p style="margin: 5px 0 0 0; color: #6b7280;">{departure_date}</p>
                <p style="margin: 0; color: #6b7280;">{departure_time}</p>
              </div>
              <div style="flex: 1; padding: 15px; background: #fef3c7; border-radius: 8px;">
                <p style="margin: 0 0 5px 0; color: #d97706; font-weight: bold;">ARRIVAL</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">{arrival_city} ({arrival_code})</p>
                <p style="margin: 5px 0 0 0; color: #6b7280;">{departure_date}</p>
                <p style="margin: 0; color: #6b7280;">{arrival_time}</p>
              </div>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💳 Fare & Payment</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Base Fare:</td>
                <td style="padding: 8px 0; text-align: right;">$` + `{base_fare}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Taxes & Fees:</td>
                <td style="padding: 8px 0; text-align: right;">$` + `{taxes_fees}</td>
              </tr>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; font-size: 16px;">Total Paid:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #059669;">$` + `{total_price}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Payment Method:</td>
                <td style="padding: 8px 0; text-align: right;">{payment_method}</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🧳 Baggage Allowance</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Cabin Bag:</td>
                <td style="padding: 8px 0;">7 kg</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Checked Bag:</td>
                <td style="padding: 8px 0;">23 kg</td>
              </tr>
            </table>
          </div>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px; text-align: center;">
            Please keep this e-ticket for your records. Present this at check-in.
          </p>
        </div>
        <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 ParcelX Flights. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">If you have any questions, please contact our support team.</p>
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A'
    return timeStr.substring(0, 5)
  }

  const passengers = booking.passengers || []
  const passengersHtml = passengers.length > 0 
    ? passengers.map((p, i) => `
        <div style="padding: 10px 0; ${i > 0 ? 'border-top: 1px solid #e5e7eb;' : ''}">
          <p style="margin: 0; font-weight: bold;">${p.title || ''} ${p.first_name} ${p.last_name}</p>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
            ${p.passenger_type?.charAt(0).toUpperCase() + p.passenger_type?.slice(1) || 'Adult'}
            ${p.passport_number ? ' • Passport: ' + p.passport_number : ''}
          </p>
        </div>
      `).join('')
    : '<p style="color: #6b7280;">No passenger details available</p>'

  const flight = booking.flight || {}
  const baseFare = Number(booking.total_price) - Number(booking.taxes_fees || 0)

  const templateData = {
    booking_reference: booking.booking_reference,
    eticket_number: booking.eticket_number || 'Pending',
    issue_date: formatDate(new Date().toISOString()),
    departure_date: formatDate(booking.departure_date),
    return_date: booking.return_date ? formatDate(booking.return_date) : 'N/A',
    cabin_class: booking.cabin_class?.charAt(0).toUpperCase() + booking.cabin_class?.slice(1),
    total_passengers: booking.total_passengers,
    total_price: Number(booking.total_price).toFixed(2),
    base_fare: baseFare.toFixed(2),
    taxes_fees: Number(booking.taxes_fees || 0).toFixed(2),
    payment_method: booking.payment_crypto_name 
      ? `${booking.payment_crypto_name} (${booking.payment_network_type})` 
      : 'Crypto',
    passengers_list: passengersHtml,
    airline_name: flight.airline?.name || 'ParcelX Airways',
    flight_number: flight.flight_number || 'N/A',
    departure_city: flight.departure_airport?.city || 'N/A',
    departure_code: flight.departure_airport?.code || '',
    departure_time: formatTime(flight.departure_time),
    arrival_city: flight.arrival_airport?.city || 'N/A',
    arrival_code: flight.arrival_airport?.code || '',
    arrival_time: formatTime(flight.arrival_time),
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
