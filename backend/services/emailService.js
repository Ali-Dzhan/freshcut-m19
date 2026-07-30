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

</head>


<body style="
margin:0;
padding:0;
background:#080808;
font-family:Arial, Helvetica, sans-serif;
color:#F4FDFF;
">


<div style="
padding:40px 15px;
background:#080808;
">


<div style="
max-width:600px;
margin:auto;
background:#0f120f;
border:1px solid rgba(120,185,60,0.16);
border-radius:18px;
padding:35px;
">


<div style="
text-align:center;
margin-bottom:35px;
">


<div style="
width:55px;
height:55px;
margin:auto;
border-radius:50%;
border:2px solid #78B93C;
display:flex;
align-items:center;
justify-content:center;
color:#A3E066;
font-size:20px;
font-weight:bold;
">

M19

</div>


<h2 style="
margin-top:15px;
color:#F4FDFF;
">

FreshCut <span style="color:#78B93C">
M19
</span>

</h2>


</div>



${content}



<div style="
text-align:center;
margin-top:35px;
color:#8A948A;
font-size:12px;
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

name:"FreshCut M19",

email:"freshcutm19@gmail.com"

};



email.to = [

{

email:process.env.BARBER_EMAIL

}

];



email.subject =
"New FreshCut M19 Booking ✂️";



email.htmlContent = emailTemplate(`


<h2 style="
color:#F4FDFF;
">

New Booking

</h2>



<div style="
background:#131712;
border:1px solid rgba(120,185,60,0.16);
border-radius:18px;
padding:25px;
">



<p>
<span style="color:#A3E066;font-size:12px;">
CUSTOMER
</span>
<br>

${booking.name}

</p>



<p>
<span style="color:#A3E066;font-size:12px;">
PHONE
</span>
<br>

${booking.phone}

</p>



<p>
<span style="color:#A3E066;font-size:12px;">
EMAIL
</span>
<br>

${booking.email}

</p>



<p>
<span style="color:#A3E066;font-size:12px;">
SERVICE
</span>
<br>

${booking.service}

</p>



<p>
<span style="color:#A3E066;font-size:12px;">
DATE
</span>
<br>

${booking.date}

</p>



<p>
<span style="color:#A3E066;font-size:12px;">
TIME
</span>
<br>

${booking.time}

</p>



<p>
<span style="color:#A3E066;font-size:12px;">
NOTE
</span>
<br>

${booking.note || "None"}

</p>



</div>



<a href="https://freshcut-m19.onrender.com/admin"

style="
display:block;
margin-top:30px;
background:#78B93C;
color:#080808;
padding:15px;
text-align:center;
border-radius:999px;
font-weight:bold;
text-decoration:none;
">

Open Admin Panel

</a>


`);



return apiInstance.sendTransacEmail(email);

}





async function sendCustomerConfirmation(booking) {


const email = new SibApiV3Sdk.SendSmtpEmail();



email.sender = {

name:"FreshCut M19",

email:"freshcutm19@gmail.com"

};



email.to = [

{

email:booking.email

}

];



email.subject =
"FreshCut M19 Booking Received ✂️";



email.htmlContent = emailTemplate(`


<h2>
Booking Received ✂️
</h2>



<p style="color:#8A948A">

Hello ${booking.name},

</p>



<p style="color:#8A948A">

Your appointment request has been received.

We will confirm your appointment shortly.

</p>



<div style="
background:#131712;
border:1px solid rgba(120,185,60,0.16);
border-radius:18px;
padding:25px;
">



<p>

<span style="color:#A3E066;font-size:12px;">
SERVICE
</span>

<br>

${booking.service}

</p>



<p>

<span style="color:#A3E066;font-size:12px;">
DATE
</span>

<br>

${booking.date}

</p>



<p>

<span style="color:#A3E066;font-size:12px;">
TIME
</span>

<br>

${booking.time}

</p>



</div>



`);



return apiInstance.sendTransacEmail(email);

}





module.exports = {

sendBookingNotification,

sendCustomerConfirmation

};