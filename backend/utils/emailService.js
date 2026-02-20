const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendResetEmail = async (to, link) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Set Your Password',
    text: `Click the link to set your password:\n\n${link}`
  });
};


exports.sendLeadConfirmationEmail = async (to, name) => {
  const message = `
Hi ${name},

Thank you for showing interest in VipraGo! We've received your request for a product demo. 
Our team will get in touch with you shortly.

Best regards,
Team Vipra Software
https://www.viprasoftware.com/
`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Your VipraGo Demo Request Received",
    text: message,
  });
};

// ✅ For general-purpose notification emails
exports.sendNotificationEmail = async ({ to, subject, message }) => {
  const text = `Hi,

${message}

Best regards,  
VipraGo Notification System  
https://www.viprasoftware.com/`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  });

  console.log(`✅ Notification email sent to ${to}`);
};