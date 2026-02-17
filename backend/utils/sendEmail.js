const sendEmail = async (options) => {
  const url = 'https://api.brevo.com/v3/smtp/email';
  
  const optionsData = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.EMAIL_PASS, // Your xkeysib-... key
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'CliniqueAI Security',
        email: process.env.EMAIL_USER // sohamchaudhary041@gmail.com
      },
      to: [
        {
          email: options.to
        }
      ],
      subject: options.subject,
      htmlContent: options.html
    })
  };

  try {
    console.log(`📨 Sending via Brevo API to: ${options.to}`);
    const response = await fetch(url, optionsData);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("✅ Email sent successfully via API. Message ID:", data.messageId);
  } catch (error) {
    console.error("❌ Email API Error:", error.message);
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;