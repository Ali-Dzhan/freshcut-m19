require("dotenv").config();

const { sendBookingNotification } = require("./services/emailService");


const testBooking = {
    name: "Ali Test",
    phone: "0888123456",
    email: "alidzhansadak04@gmail.com",
    service: "Fade",
    date: "2026-07-30",
    time: "15:00",
    note: "Testing email"
};


sendBookingNotification(testBooking)
    .then(() => {
        console.log("Email sent!");
    })
    .catch(err => {
        console.log(err);
    });