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
  // 2. CALENDAR DAY SELECTION
  // ==========================================

  const calendarDays = document.querySelectorAll(".calendar-grid .day:not(.disabled)");

  calendarDays.forEach(day => {
    day.addEventListener("click", () => {
      calendarDays.forEach(d => d.classList.remove("active"));
      day.classList.add("active");
    });
  });

  // ==========================================
  // 3. WORKING DAYS & HOURS
  // ==========================================

  const schedule = {
    tuesday: [
      "10:00","10:30","11:00","11:30",
      "12:00","12:30","13:00","13:30",
      "14:00","14:30","15:00","15:30",
      "16:00","16:30","17:00","17:30",
      "18:00","18:30"
    ],
    wednesday: [
      "10:00","10:30","11:00","11:30",
      "12:00","12:30","13:00","13:30",
      "14:00","14:30","15:00","15:30",
      "16:00","16:30","17:00","17:30",
      "18:00","18:30"
    ],
    thursday: [
      "10:00","10:30","11:00","11:30",
      "12:00","12:30","13:00","13:30",
      "14:00","14:30","15:00","15:30",
      "16:00","16:30","17:00","17:30",
      "18:00","18:30"
    ],
    friday: [
      "10:00","10:30","11:00","11:30",
      "12:00","12:30","13:00","13:30",
      "14:00","14:30","15:00","15:30",
      "16:00","16:30","17:00","17:30",
      "18:00","18:30"
    ],
    saturday: [
      "10:00","10:30","11:00","11:30",
      "12:00","12:30","13:00","13:30",
      "14:00","14:30","15:00","15:30",
      "16:00","16:30","17:00","17:30"
    ]
  };

  const dayButtons = document.querySelectorAll(".period-pill:not(.disabled)");
  const slotsContainer = document.querySelector(".time-slots-container");

  function renderSlots(day) {
    if (!slotsContainer || !schedule[day]) return;

    slotsContainer.innerHTML = "";

    schedule[day].forEach(time => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "time-slot";
      button.textContent = time;

      button.addEventListener("click", () => {
        document.querySelectorAll(".time-slot").forEach(slot => {
          slot.classList.remove("active");
        });

        button.classList.add("active");
      });

      slotsContainer.appendChild(button);
    });
  }

  dayButtons.forEach(button => {
    button.addEventListener("click", () => {
      dayButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      renderSlots(button.dataset.day);
    });
  });

  renderSlots("tuesday");

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
});