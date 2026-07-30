const SibApiV3Sdk = require("sib-api-v3-sdk");


const defaultClient = SibApiV3Sdk.ApiClient.instance;


defaultClient.authentications["api-key"].apiKey =
    process.env.BREVO_API_KEY;


const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();



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

    email.subject = "New FreshCut M19 Booking";

    email.htmlContent = `
        <h2>New Booking</h2>
        <p>Name: ${booking.name}</p>
        <p>Phone: ${booking.phone}</p>
        <p>Email: ${booking.email}</p>
        <p>Service: ${booking.service}</p>
        <p>Date: ${booking.date}</p>
        <p>Time: ${booking.time}</p>
        <p>Note: ${booking.note || "None"}</p>
    `;


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

    email.subject = "FreshCut M19 Booking Received";

    email.htmlContent = `
        <h2>Hello ${booking.name}</h2>
        <p>Your booking request has been received.</p>
        <p>Date: ${booking.date}</p>
        <p>Time: ${booking.time}</p>
        <p>We will confirm your appointment soon.</p>
    `;


    return apiInstance.sendTransacEmail(email);
}



module.exports = {
    sendBookingNotification,
    sendCustomerConfirmation
};