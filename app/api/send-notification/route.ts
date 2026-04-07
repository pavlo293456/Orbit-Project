import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { type, appointment, service } = await request.json()
    
    const businessEmail = process.env.NEXT_PUBLIC_BUSINESS_EMAIL!
    const clientEmail = appointment.client_email
    
    let subject = ''
    let clientHtml = ''
    let adminHtml = ''
    
    const appointmentDetails = `
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Service:</strong> ${service.name_en}</p>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${appointment.appointment_time}</p>
        <p style="margin: 8px 0;"><strong>Client:</strong> ${appointment.client_name}</p>
        <p style="margin: 8px 0;"><strong>Phone:</strong> ${appointment.client_phone}</p>
        ${appointment.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
      </div>
    `
    
    switch (type) {
      case 'new_booking':
        subject = 'New Booking Request - Ukrainian Translation & Notary'
        
        clientHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Booking Request Received</h1>
            <p>Dear ${appointment.client_name},</p>
            <p>Thank you for booking with us! Your appointment request has been received and is pending approval.</p>
            ${appointmentDetails}
            <p>You will receive a confirmation email once your appointment is approved.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Office Location:</strong></p>
              <p style="margin: 4px 0;">Inside Orbit Ukrainian Mirko Store</p>
              <p style="margin: 4px 0;">10219 97 St NW, Edmonton, AB T5J 0L6</p>
              <p style="margin: 4px 0;">Phone: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE}</p>
            </div>
          </div>
        `
        
        adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Booking Request</h1>
            <p>A new appointment has been requested:</p>
            ${appointmentDetails}
            <div style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View in Dashboard
              </a>
            </div>
          </div>
        `
        break
      
      case 'appointment_approved':
        subject = 'Your Appointment is Confirmed'
        
        clientHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Appointment Confirmed!</h1>
            <p>Dear ${appointment.client_name},</p>
            <p>Great news! Your appointment has been confirmed.</p>
            ${appointmentDetails}
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Please arrive 5 minutes early.</strong></p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Office Location:</strong></p>
              <p style="margin: 4px 0;">Inside Orbit Ukrainian Mirko Store</p>
              <p style="margin: 4px 0;">10219 97 St NW, Edmonton, AB T5J 0L6</p>
              <p style="margin: 4px 0;">Phone: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE}</p>
            </div>
            <p style="margin-top: 20px;">If you need to cancel or reschedule, please call us as soon as possible.</p>
          </div>
        `
        break
      
      case 'appointment_cancelled':
        subject = 'Appointment Cancelled'
        
        clientHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Appointment Cancelled</h1>
            <p>Dear ${appointment.client_name},</p>
            <p>Your appointment has been cancelled.</p>
            ${appointmentDetails}
            <p>If you would like to reschedule, please visit our website or call us.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;">Phone: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE}</p>
              <p style="margin: 4px 0;">Email: ${businessEmail}</p>
            </div>
          </div>
        `
        break
    }
    
    // Send email to client
    if (clientHtml) {
      await resend.emails.send({
        from: 'Ukrainian Translation & Notary <noreply@yourdomain.com>',
        to: clientEmail,
        subject: subject,
        html: clientHtml
      })
    }
    
    // Send notification to admin for new bookings
    if (adminHtml && type === 'new_booking') {
      await resend.emails.send({
        from: 'Booking System <noreply@yourdomain.com>',
        to: businessEmail,
        subject: subject,
        html: adminHtml
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
