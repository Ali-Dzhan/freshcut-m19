// Hours placeholder note: opening hours are an assumption based on the "opens Tuesday 10:00" signal —
// confirm and edit the .hours-table rows in the HTML file with the real schedule.

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. MOBILE BURGER MENU TOGGLE
  // ==========================================
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta');

  if (burgerBtn && mobileMenu) {
    // Toggle menu open/close on burger click
    burgerBtn.addEventListener('click', () => {
      burgerBtn.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });

    // Close menu when clicking any nav link
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        burgerBtn.classList.remove('active');
        mobileMenu.classList.remove('open');
      });
    });
  }

  // ==========================================
  // 2. APP-STYLE APPOINTMENT PICKER
  // ==========================================
  // Calendar Days selection
  const days = document.querySelectorAll('.calendar-grid .day:not(.disabled)');
  days.forEach(day => {
    day.addEventListener('click', () => {
      days.forEach(d => d.classList.remove('active'));
      day.classList.add('active');
    });
  });

  // Period filter selection (Сутрин / Следобед / Вечер)
  const periodPills = document.querySelectorAll('.period-pill');
  periodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      periodPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // Time Slots selection
  const timeSlots = document.querySelectorAll('.time-slot');
  timeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      timeSlots.forEach(s => s.classList.remove('active'));
      slot.classList.add('active');
    });
  });

  // ==========================================
  // 3. BOOKING FORM SUBMISSION
  // ==========================================
  const form = document.getElementById('bookingForm');
  const confirmBox = document.getElementById('confirmBox');

  if (form && confirmBox) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      // NOTE: this is a front-end-only demo. To actually receive these bookings,
      // wire this up to an email service (e.g. EmailJS, Resend) or a small backend
      // that stores the appointment and checks for slot conflicts.
      form.classList.add('hide');
      confirmBox.classList.add('show');
    });
  }
});