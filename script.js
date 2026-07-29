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
  // NAVBAR SCROLL EFFECT
  // ==========================================
  const nav = document.querySelector("nav");
  if (nav) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 10) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    });
  }

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
  

  const slotsContainer = document.querySelector(".time-slots-container");
  const submitBtn = document.querySelector('#bookingForm button[type="submit"]');

  // Helper function to check booking state and toggle submit button
  function updateSubmitButtonState() {
    if (!submitBtn) return;
    const activeDay = document.querySelector(".calendar-grid .day.active:not(.disabled)");
    const activeSlot = document.querySelector(".time-slot.active");
    submitBtn.disabled = !(activeDay && activeSlot);
  }

  // Disable Sundays (0) and Mondays (1)
  document.querySelectorAll(".calendar-grid .day").forEach(day => {
    if (day.classList.contains('disabled')) return; // Skip already disabled (past) days

    const dayNumber = parseInt(day.textContent, 10);
    const date = new Date(2026, 6, dayNumber); // Month is 0-indexed (6 = July)
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 1) {
        day.classList.add("disabled");
    }
  });

  const calendarDays = document.querySelectorAll(".calendar-grid .day:not(.disabled)");

  async function renderSlots(date) {

    if (!slotsContainer) return;

    slotsContainer.innerHTML = 
        `<p class="loading-message">Зареждане...</p>`;

    try {

        const response = await fetch(
            `http://localhost:3000/available-slots?date=${date}`
        );

        const slots = await response.json();

        slotsContainer.innerHTML = "";

        if (slots.length === 0) {

            slotsContainer.innerHTML =
                `<p class="no-slots-message">
                    Затворено или няма свободни часове.
                </p>`;

            updateSubmitButtonState();
            return;
        }

        slots.forEach((time) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "time-slot";
            button.textContent = time;

            button.addEventListener("click", () => {
                document
                .querySelectorAll(".time-slot")
                .forEach(slot =>
                    slot.classList.remove("active")
                );
                button.classList.add("active");
                updateSubmitButtonState();
            });
            slotsContainer.appendChild(button);
        });
        updateSubmitButtonState();

    } catch(error) {


        console.error(
            "Slots loading error:",
            error
        );


        slotsContainer.innerHTML =
        `<p class="no-slots-message">
            Грешка при зареждане.
        </p>`;

    }

}

  calendarDays.forEach((day) => {
    day.addEventListener("click", () => {
      // Clear active time slot when changing day
      const activeSlot = document.querySelector(".time-slot.active");
      if (activeSlot) activeSlot.classList.remove("active");

      calendarDays.forEach((d) => d.classList.remove("active"));
      day.classList.add("active");

      const dayNumber = parseInt(day.textContent, 10);
      const date = new Date(2026, 6, dayNumber); // Month is 0-indexed (6 = July)

      const formattedDate =
      date.toISOString().split("T")[0];


      renderSlots(formattedDate);
    });
  });

  // Initial render based on the pre-selected day
  const activeDay = document.querySelector(".calendar-grid .day.active");
  if (activeDay && activeDay.classList.contains('disabled')) {
    // If the pre-selected day is disabled (e.g., it's a Monday), remove active class
    activeDay.classList.remove('active');
  }

  // Trigger click on the first available day to show slots, or the active one if it's valid
  const firstAvailableDay = document.querySelector(".calendar-grid .day:not(.disabled)");
  const validActiveDay = document.querySelector(".calendar-grid .day.active:not(.disabled)");

  if (validActiveDay) {
    validActiveDay.click();
  } else if (firstAvailableDay) {
    firstAvailableDay.click();
  }
  updateSubmitButtonState();

 // ==========================================
// 4. BOOKING FORM + BACKEND CONNECTION
// ==========================================

const form = document.getElementById("bookingForm");
const confirmBox = document.getElementById("confirmBox");

let selectedTime = null;
let selectedDate = null;

// Track selected time
document.addEventListener("click", (e) => {

    if (e.target.classList.contains("time-slot")) {
        selectedTime = e.target.textContent;
    }

});

// Track selected date
document.querySelectorAll(".calendar-grid .day")
.forEach(day => {
    day.addEventListener("click", () => {
        if(day.classList.contains("disabled"))
            return;
        const dayNumber =
            parseInt(day.textContent, 10);
        const date =
            new Date(2026, 6, dayNumber);
        selectedDate =
            date.toISOString().split("T")[0];
    });
});
if (form && confirmBox) {
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        if(!selectedDate || !selectedTime) {
            alert(
                "Моля изберете дата и час."
            );
            return;
        }
        const formData = new FormData(form);
        const booking = {
            name:
                formData.get("name"),
            phone:
                formData.get("phone"),
            email:
                formData.get("email"),
            service:
                formData.get("service"),
            date:
                selectedDate,
            time:
                selectedTime

        };




        try {


            const response =
                await fetch(
                    "http://localhost:3000/book",
                    {

                        method:"POST",

                        headers:{
                            "Content-Type":
                            "application/json"
                        },


                        body:
                        JSON.stringify(booking)

                    }
                );
            const result =
                await response.json();

            if(!response.ok){
                alert(
                    result.message ||
                    "Грешка при запазване."
                );
                return;
            }
            // Success
            form.classList.add("hide");
            confirmBox.classList.add("show");
        } catch(error){
            console.error(error);
            alert(
                "Сървърът не отговаря."
            );
        }
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
    const modalContent = bookingModal.querySelector(".modal-content"); // The element that moves
    const modalHeader = bookingModal.querySelector(".modal-header");   // The element to drag from
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      // Only on mobile
      if (window.innerWidth <= 580) {
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
    
    // Attach listeners to the header, not the whole content
    modalHeader.addEventListener("touchstart", handleTouchStart, { passive: false });
    modalHeader.addEventListener("touchmove", handleTouchMove, { passive: false });
    modalHeader.addEventListener("touchend", handleTouchEnd);
  }
});