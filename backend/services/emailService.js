const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;

defaultClient.authentications["api-key"].apiKey =
    process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

function emailTemplate(content) {
return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
margin: 0;
padding: 0;
background: #080808;
font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
color: #F4FDFF;
-webkit-font-smoothing: antialiased;
">

<div style="
padding: 40px 15px;
background: #080808;
">

<div style="
max-width: 600px;
margin: auto;
background: #0f120f;
border: 1px solid rgba(120, 185, 60, 0.2);
border-radius: 20px;
padding: 40px 30px;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
">

<!-- LOGO & HEADER -->
<div style="
text-align: center;
margin-bottom: 30px;
border-bottom: 1px solid rgba(120, 185, 60, 0.15);
padding-bottom: 25px;
">

<img src="https://freshcut-m19.onrender.com/photos/logo.jpg" alt="FreshCut M19 Logo" style="
width: 70px;
height: 70px;
border-radius: 50%;
border: 2px solid #78B93C;
object-fit: cover;
margin-bottom: 12px;
background: #131712;
display: block;
margin-left: auto;
margin-right: auto;
">

<h2 style="
margin: 0;
color: #F4FDFF;
font-size: 22px;
letter-spacing: 0.5px;
">
FreshCut <span style="color: #78B93C;">M19</span>
</h2>

</div>

<!-- CONTENT SLOT -->
${content}

<!-- FOOTER -->
<div style="
text-align: center;
margin-top: 35px;
padding-top: 20px;
border-top: 1px solid rgba(120, 185, 60, 0.15);
color: #8A948A;
font-size: 12px;
letter-spacing: 0.5px;
">
Premium Barber Studio • FreshCut M19
</div>

</div>

</div>

</body>
</html>
`;
}

async function sendBookingNotification(booking) {
const email = new SibApiV3Sdk.SendSmtpEmail();

email.sender = {
name: "FreshCut M19",
email: "freshcutm19@gmail.com"
};

email.to = [
{
email: process.env.BARBER_EMAIL
}
];

email.subject = "New FreshCut M19 Booking ✂️";

email.htmlContent = emailTemplate(`

<div style="text-align: center; margin-bottom: 25px;">
<span style="
background: rgba(120, 185, 60, 0.15);
color: #A3E066;
padding: 6px 14px;
border-radius: 20px;
font-size: 11px;
font-weight: bold;
letter-spacing: 1px;
text-transform: uppercase;
">
New Appointment Alert
</span>
</div>

<div style="
background: #131712;
border: 1px solid rgba(120, 185, 60, 0.2);
border-radius: 14px;
padding: 20px 25px;
">

<table style="width: 100%; border-collapse: collapse;">
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Customer</span><br>
    <strong style="font-size: 15px; color: #F4FDFF;">${booking.name}</strong>
  </td>
</tr>
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Phone</span><br>
    <a href="tel:${booking.phone}" style="color: #F4FDFF; text-decoration: none;">${booking.phone}</a>
  </td>
</tr>
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Email</span><br>
    <a href="mailto:${booking.email}" style="color: #F4FDFF; text-decoration: none;">${booking.email}</a>
  </td>
</tr>
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Service</span><br>
    <strong style="color: #F4FDFF;">${booking.service}</strong>
  </td>
</tr>
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Date & Time</span><br>
    <strong style="color: #F4FDFF;">${booking.date} at ${booking.time}</strong>
  </td>
</tr>
<tr>
  <td style="padding: 10px 0;">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Note</span><br>
    <span style="color: #8A948A;">${booking.note || "None"}</span>
  </td>
</tr>
</table>

</div>

<a href="https://freshcut-m19.onrender.com/admin"
style="
display: block;
margin-top: 30px;
background: #78B93C;
color: #080808;
padding: 14px;
text-align: center;
border-radius: 999px;
font-weight: bold;
text-decoration: none;
font-size: 14px;
box-shadow: 0 4px 15px rgba(120, 185, 60, 0.3);
">
Open Admin Panel
</a>

`);

return apiInstance.sendTransacEmail(email);
}

async function sendCustomerConfirmation(booking) {
const email = new SibApiV3Sdk.SendSmtpEmail();

email.sender = {
name: "FreshCut M19",
email: "freshcutm19@gmail.com"
};

email.to = [
{
email: booking.email
}
];

email.subject = "FreshCut M19 Booking Received ✂️";

email.htmlContent = emailTemplate(`

<h3 style="color: #F4FDFF; margin-top: 0; font-size: 18px; text-align: center;">
Booking Request Received ✂️
</h3>

<p style="color: #8A948A; text-align: center; font-size: 14px; line-height: 1.5; margin-bottom: 25px;">
Hello <strong style="color: #F4FDFF;">${booking.name}</strong>,<br>
Your appointment request has been safely received. We will confirm your details shortly.
</p>

<div style="
background: #131712;
border: 1px solid rgba(120, 185, 60, 0.2);
border-radius: 14px;
padding: 20px 25px;
">

<table style="width: 100%; border-collapse: collapse;">
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Service</span><br>
    <strong style="color: #F4FDFF;">${booking.service}</strong>
  </td>
</tr>
<tr>
  <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Date</span><br>
    <strong style="color: #F4FDFF;">${booking.date}</strong>
  </td>
</tr>
<tr>
  <td style="padding: 10px 0;">
    <span style="color: #A3E066; font-size: 11px; font-weight: bold; text-transform: uppercase;">Time</span><br>
    <strong style="color: #F4FDFF;">${booking.time}</strong>
  </td>
</tr>
</table>

</div>

`);

return apiInstance.sendTransacEmail(email);
}

module.exports = {
sendBookingNotification,
sendCustomerConfirmation
};