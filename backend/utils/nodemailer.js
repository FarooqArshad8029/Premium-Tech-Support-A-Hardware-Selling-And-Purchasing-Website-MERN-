// utils/email.js

const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'premium.tech9990@gmail.com', // Your Gmail email address
        pass: 'yfkoyfxtjttpmryp' // Your Gmail password
    }
});

// Function to send verification email
exports.sendVerificationEmail = async (recipientEmail, verificationToken) => {
    try {
        // Email content
        const mailOptions = {
            from: 'premium.tech9990@gmail.com', // Sender address (Your Gmail email address)
            to: recipientEmail, // Recipient address
            subject: 'Email Verification', // Email subject
            html: `<p>Click <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}">here</a> to verify your email.</p>` // Email body with verification link
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent.');
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Error sending verification email');
    }
};

exports.sendEmail = async (options) => {
    const mailOptions = {
      from: 'your-email@gmail.com', // Sender address
      to: options.to,               // Recipient address
      subject: options.subject,     // Subject line
      text: options.text,           // Plain text body
      html: options.html            // HTML body (optional)
    };
  
    try {
      // Send the email
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully.');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error sending email');
    }
  };
 
  
exports.sendContactUsEmail = async (options) => {
  const mailOptions = {
    from: options.to, // Sender address
    to: 'premium.tech9990@gmail.com',               // Recipient address
    subject: options.subject,     // Subject line
    text: options.text,           // Plain text body
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
};