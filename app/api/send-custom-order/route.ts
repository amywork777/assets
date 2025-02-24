import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const customerEmail = formData.get('email') as string
    const stlFile = formData.get('file') as File
    const productName = formData.get('productName') as string
    
    // Convert File to Buffer
    const arrayBuffer = await stlFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to: process.env.NEXT_PUBLIC_EMAIL_USER,
      subject: `Custom Order Request - ${productName}`,
      text: `Customer Email: ${customerEmail}\n\nHello, I would like to request a custom order for the ${productName} design with the current dimensions shown in the configurator. Please find the attached STL file for reference.`,
      attachments: [
        {
          filename: `${productName}_3d_model.stl`,
          content: buffer
        }
      ]
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 })
  }
} 