/* === STEP 3: JavaScript Fluid Ring Animation === */

window.addEventListener("load", () => {
  const canvas = document.getElementById("fluidRingCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const config = {
    innerRadius: 0,
    outerRadius: 0,
    particleCount: 0,
    dotMinSize: 0.325,
    dotMaxSize: 2.5,
    baseColor: { h: 90, s: 70, l: 50 },
    highColor: { h: 90, s: 90, l: 70 },
    flowSpeed: 0.015,
    turbulence: 0.05,
  };

  let particles = [];

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const size = Math.min(canvas.width, canvas.height);

    if (window.innerWidth <= 576) {
      // Phones
      config.innerRadius = size * 0.42;
      config.outerRadius = size * 0.64;
      config.particleCount = 700;
      config.dotMaxSize = 1.725;
    } else if (window.innerWidth <= 992) {
      // Tablets
      config.innerRadius = size * 0.24;
      config.outerRadius = size * 0.37;
      config.particleCount = 1200;
      config.dotMaxSize = 2;
    } else {
      // Desktop
      config.innerRadius = 280;
      config.outerRadius = 440;
      config.particleCount = 1600;
      config.dotMaxSize = 2.5;
    }

    createParticles();
  }

  class Particle {
    constructor(baseRadius, angle) {
      this.baseRadius = baseRadius;
      this.angle = angle;

      this.size =
        Math.random() *
          (config.dotMaxSize - config.dotMinSize) +
        config.dotMinSize;

      this.offsetAngle = angle;
      this.currentRadius = baseRadius;

      this.velocityAngle = Math.random() * 0.02 - 0.01;
      this.velocityRadius = 0;

      this.friction = 0.96;
      this.colorIntensity = 0;
    }

    update(time) {
      this.angle += config.flowSpeed;

      const noise =
        Math.sin(
          this.baseRadius * 0.02 +
          this.angle * 3 +
          time * 2
        ) * config.turbulence;

      this.velocityAngle += noise * 0.01;
      this.velocityRadius += noise * 0.5;

      this.offsetAngle += this.velocityAngle;
      this.currentRadius += this.velocityRadius;

      this.velocityAngle *= this.friction;
      this.velocityRadius *= this.friction;

      const targetRadius = config.innerRadius + 10;

      if (this.currentRadius < targetRadius) {
        this.currentRadius = targetRadius;
        this.velocityRadius *= -0.5;
      }

      if (this.currentRadius > config.outerRadius) {
        this.currentRadius = config.outerRadius;
        this.velocityRadius *= -0.5;
      }

      this.x =
        canvas.width / 2 +
        Math.cos(this.offsetAngle) * this.currentRadius;

      this.y =
        canvas.height / 2 +
        Math.sin(this.offsetAngle) * this.currentRadius;

      this.colorIntensity =
        Math.abs(this.velocityAngle) * 50 +
        Math.abs(this.velocityRadius) * 2;

      this.colorIntensity = Math.min(1, this.colorIntensity);
    }

    draw() {
      const h = config.baseColor.h;

      const s =
        config.baseColor.s +
        (config.highColor.s - config.baseColor.s) *
        this.colorIntensity;

      const l =
        config.baseColor.l +
        (config.highColor.l - config.baseColor.l) *
        this.colorIntensity;

      ctx.shadowBlur = this.size * 4;
      ctx.shadowColor = `hsla(${h}, ${s}%, ${l}%, ${
        0.6 + this.colorIntensity * 0.4
      })`;

      ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, 0.9)`;

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function createParticles() {
    particles = [];

    for (let i = 0; i < config.particleCount; i++) {
      const radius =
        config.innerRadius +
        Math.random() *
        (config.outerRadius - config.innerRadius);

      particles.push(
        new Particle(radius, Math.random() * Math.PI * 2)
      );
    }
  }

  resizeCanvas();

  window.addEventListener("resize", resizeCanvas);

  function animate(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      particle.update(time * 0.001);
      particle.draw();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});

document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // 1. MOBILE BURGER MENU TOGGLE
  // ==========================================

  const burgerBtn = document.getElementById("burgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-link, .mobile-cta");

  if (burgerBtn && mobileMenu) {
    burgerBtn.addEventListener("click", () => {
      burgerBtn.classList.toggle("active");
      mobileMenu.classList.toggle("open");
    });

    mobileLinks.forEach(link => {
      link.addEventListener("click", () => {
        burgerBtn.classList.remove("active");
        mobileMenu.classList.remove("open");
      });
    });
  }

  // ==========================================
  // 3. APPOINTMENT SCHEDULING LOGIC
  // ==========================================
  const schedule = {
    tuesday: [
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
      "18:00", "18:30",
    ],
    wednesday: [
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
      "18:00", "18:30",
    ],
    thursday: [
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
      "18:00", "18:30",
    ],
    friday: [
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
      "18:00", "18:30",
    ],
    saturday: [
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    ],
  };

  const calendarDays = document.querySelectorAll(".calendar-grid .day:not(.disabled)");
  const slotsContainer = document.querySelector(".time-slots-container");
  const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  function renderSlots(day) {
    if (!slotsContainer) return;
    slotsContainer.innerHTML = "";

    const daySchedule = schedule[day];

    if (!daySchedule || daySchedule.length === 0) {
      slotsContainer.innerHTML = `<p class="no-slots-message">Затворено. Моля, изберете друг ден.</p>`;
      return;
    }

    daySchedule.forEach((time) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "time-slot";
      button.textContent = time;

      button.addEventListener("click", () => {
        document.querySelectorAll(".time-slot").forEach((slot) => {
          slot.classList.remove("active");
        });

        button.classList.add("active");
      });

      slotsContainer.appendChild(button);
    });
  }

  calendarDays.forEach((day) => {
    day.addEventListener("click", () => {
      calendarDays.forEach((d) => d.classList.remove("active"));
      day.classList.add("active");

      const dayNumber = parseInt(day.textContent, 10);
      const date = new Date(2026, 6, dayNumber); // Month is 0-indexed (6 = July)
      const dayName = dayMap[date.getDay()];
      renderSlots(dayName);
    });
  });

  // Initial render based on the pre-selected day
  const initiallyActiveDay = document.querySelector(".calendar-grid .day.active");
  if (initiallyActiveDay) {
    initiallyActiveDay.click();
  } else if (calendarDays.length > 0) {
    calendarDays[0].click();
  }

 // ==========================================
  // 4. BOOKING FORM
  // ==========================================

  const form = document.getElementById("bookingForm");
  const confirmBox = document.getElementById("confirmBox");

  if (form && confirmBox) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      form.classList.add("hide");
      confirmBox.classList.add("show");
    });
  }

  // ==========================================
  // 5. MODAL POP-UP LOGIC (Multi-Trigger)
  // ==========================================
  const bookingModal = document.getElementById("bookingModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  
  // Select ALL buttons that should open the modal
  const openBookingBtns = document.querySelectorAll("#openBookingBtn, .trigger-booking");

  if (bookingModal && closeModalBtn) {
    // Loop through all trigger buttons and attach the open event
    openBookingBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault(); // Stop any default link behavior
        bookingModal.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
        
        // If clicked from the mobile menu, close the mobile menu automatically
        const mobileMenu = document.getElementById("mobileMenu");
        const burgerBtn = document.getElementById("burgerBtn");
        if (mobileMenu && mobileMenu.classList.contains("open")) {
          mobileMenu.classList.remove("open");
          burgerBtn.classList.remove("active");
        }
      });
    });

    // Close Modal via 'X' Button
    closeModalBtn.addEventListener("click", () => {
      bookingModal.classList.remove("active");
      document.body.style.overflow = ""; // Restore scrolling
    });

    // Close Modal by clicking outside the box
    bookingModal.addEventListener("click", (e) => {
      if (e.target === bookingModal) {
        bookingModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    // Drag/Scroll to close on mobile
    const modalContent = bookingModal.querySelector(".modal-content");
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      // Only on mobile and when scrolled to the top of the modal content
      if (window.innerWidth <= 580 && modalContent.scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        modalContent.style.transition = "none"; // Allow smooth dragging
      } else {
        touchStartY = 0;
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartY === 0) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;

      if (deltaY > 0) { // Only allow dragging down
        e.preventDefault();
        modalContent.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = (e) => {
      if (touchStartY === 0) return;
      const touchY = e.changedTouches[0].clientY;
      const deltaY = touchY - touchStartY;
      modalContent.style.transition = "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)";
      if (deltaY > 100) { // If dragged more than 100px, close it
        bookingModal.classList.remove("active");
        document.body.style.overflow = "";
      }
      // Reset the inline style. CSS will handle snapping back or closing.
      modalContent.style.transform = "";
      touchStartY = 0; // Reset for next touch
    };

    modalContent.addEventListener("touchstart", handleTouchStart, { passive: false });
    modalContent.addEventListener("touchmove", handleTouchMove, { passive: false });
    modalContent.addEventListener("touchend", handleTouchEnd);
  }
});