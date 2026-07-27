// Hours placeholder note: opening hours are an assumption based on the "opens Tuesday 10:00" signal —
// confirm and edit the .hours-table rows in the HTML file with the real schedule.

document.getElementById('date').min = new Date().toISOString().split('T')[0];

const form = document.getElementById('bookingForm');
const confirmBox = document.getElementById('confirmBox');
form.addEventListener('submit', function(e){
  e.preventDefault();
  // NOTE: this is a front-end-only demo. To actually receive these bookings,
  // wire this up to an email service (e.g. EmailJS, Resend) or a small backend
  // that stores the appointment and checks for slot conflicts.
  form.classList.add('hide');
  confirmBox.classList.add('show');
});