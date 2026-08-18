require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Ledger!';
  const text = `Hi ${name},\n\nWelcome to Backend Ledger! We're excited to have you on board.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `
    <p>Hi ${name},</p>
    <p>Welcome to Backend Ledger! We're excited to have you on board.</p>
    <p>Best regards,<br>The Backend Ledger Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Notification';
  const text = `Hi ${name},\n\nYour transaction has been processed successfully. Here are the details:\n\nAmount: $${amount}\nTo Account: ${toAccount}\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `
    <p>Hi ${name},</p>
    <p>Your transaction has been processed successfully. Here are the details:</p>
    <ul>
      <li><strong>Amount:</strong> $${amount}</li>
      <li><strong>To Account:</strong> ${toAccount}</li>
    </ul>
    <p>Best regards,<br>The Backend Ledger Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, transactionDetails) {
  const subject = 'Transaction Failure Notification';
  const text = `Hi ${name},\n\nUnfortunately, your transaction could not be processed. Here are the details:\n\n${transactionDetails}\n\nPlease contact support for further assistance.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `
    <p>Hi ${name},</p>
    <p>Unfortunately, your transaction could not be processed. Here are the details:</p>
    <pre>${transactionDetails}</pre>
    <p>Please contact support for further assistance.</p>
    <p>Best regards,<br>The Backend Ledger Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendRegistrationEmail, sendTransactionEmail, sendTransactionFailureEmail };