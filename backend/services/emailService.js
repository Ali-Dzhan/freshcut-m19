const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


async function sendBookingNotification(booking) {

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.BARBER_EMAIL,
        subject: "New FreshCut M19 Booking",
        html: `
            <h2>New Booking</h2>

            <p>Name: ${booking.name}</p>
            <p>Phone: ${booking.phone}</p>
            <p>Email: ${booking.email}</p>
            <p>Service: ${booking.service}</p>
            <p>Date: ${booking.date}</p>
            <p>Time: ${booking.time}</p>
            <p>Note: ${booking.note || "None"}</p>
        `
    });

}


async function sendCustomerConfirmation(booking) {

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: booking.email,
        subject: "FreshCut M19 Booking Received",
        html: `
            <h2>Hello ${booking.name}</h2>

            <p>Your booking request has been received.</p>

            <p>
            Date: ${booking.date}<br>
            Time: ${booking.time}
            </p>

            <p>We will confirm your appointment soon.</p>
        `
    });

}


module.exports = {
    sendBookingNotification,
    sendCustomerConfirmation
};