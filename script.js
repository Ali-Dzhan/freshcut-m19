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
      config.particleCount = 480;
      config.dotMaxSize = 1.725;
    } else if (window.innerWidth <= 992) {
      // Tablets
      config.innerRadius = size * 0.24;
      config.outerRadius = size * 0.37;
      config.particleCount = 850;
      config.dotMaxSize = 2;
    } else {
      // Desktop
      config.innerRadius = 280;
      config.outerRadius = 440;
      config.particleCount = 1150;
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

  // These are now set globally within the DOMContentLoaded scope
  let selectedTime = null;
  let selectedDate = null;
  let currentActiveDayElement = null; // To keep track of the active day element


  // ==========================================
  // 3. APPOINTMENT SCHEDULING LOGIC
  // ==========================================
  
  // Use the deployed API on GitHub Pages and the local backend when running locally.
  const isProduction = window.location.hostname.includes('github.io');
  const PRODUCTION_URL = 'https://freshcut-m19.onrender.com';
  const LOCAL_URL = `http://${window.location.hostname}:3000`;

  const apiHost = isProduction ? PRODUCTION_URL : LOCAL_URL;
  const customerTokenKey = "freshcutCustomerToken";
  let displayedDate = new Date();
  displayedDate.setDate(1); // Set to the first of the month to avoid month-end issues

  const calendarGrid = document.querySelector(".calendar-grid");
  const slotsContainer = document.querySelector(".time-slots-container");
  const submitBtn = document.querySelector('#bookingForm button[type="submit"]');
  const monthElement = document.getElementById("currentMonth");
  const prevMonthBtn = document.querySelector(".picker-nav .btn-picker-arrow:first-child");
  const nextMonthBtn = document.querySelector(".picker-nav .btn-picker-arrow:last-child");

  // Helper function to check booking state and toggle submit button
  function updateSubmitButtonState() {
    if (!submitBtn) return;
    const activeDay = document.querySelector(
      ".calendar-grid .day.active:not(.disabled)"
    );
    const activeSlot = document.querySelector(".time-slot.active");
    submitBtn.disabled = !(activeDay && activeSlot);
  }

  function generateCalendar(date) {
    if (!calendarGrid || !monthElement) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    const monthName = new Intl.DateTimeFormat("bg-BG", { month: "long" }).format(date);
    monthElement.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

    calendarGrid.innerHTML = "";

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const dayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    // Previous month's trailing days
    for (let i = dayOffset - 1; i >= 0; i--) {
      const dayEl = document.createElement("span");
      dayEl.className = "day disabled";
      dayEl.textContent = daysInPrevMonth - i;
      calendarGrid.appendChild(dayEl);
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement("span");
      dayEl.className = "day";
      dayEl.textContent = i;

      const dayDate = new Date(year, month, i);
      const dayOfWeek = dayDate.getDay();

      const isPastDay = year < currentYear ||
        (year === currentYear && month < currentMonth) ||
        (year === currentYear && month === currentMonth && i < currentDate);

      if (isPastDay || dayOfWeek === 0 || dayOfWeek === 1) {
        dayEl.classList.add("disabled");
      }

      if (!dayEl.classList.contains("disabled")) {
        dayEl.addEventListener("click", () => {
          const currentActiveDay = document.querySelector(".calendar-grid .day.active");
          if (currentActiveDay) {
            currentActiveDay.classList.remove("active");
          }
          dayEl.classList.add("active");
          currentActiveDayElement = dayEl; // Store the active element

          selectedTime = null; // Reset selected time when a new day is picked
          const activeSlot = document.querySelector(".time-slot.active");
          if (activeSlot) activeSlot.classList.remove("active"); // Clear active time slot visually

          const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
          selectedDate = formattedDate;
          renderSlots(formattedDate);
        });
      }
      calendarGrid.appendChild(dayEl);
    }

    // Next month's leading days
    const totalDays = dayOffset + daysInMonth;
    const remainingCells = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    for (let i = 1; i <= remainingCells; i++) {
      const dayEl = document.createElement("span");
      dayEl.className = "day disabled";
      dayEl.textContent = i;
      calendarGrid.appendChild(dayEl);
    }

    // Disable/enable prev month button
    if (prevMonthBtn) {
      prevMonthBtn.disabled = year === currentYear && month === currentMonth;
    }
  }

  async function renderSlots(dateString) {

    if (!slotsContainer) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    slotsContainer.innerHTML = 
        `<p class="loading-message">Зареждане...</p>`;

    try {

        const response = await fetch(`${apiHost}/available-slots?date=${dateString}`);

        let slots = await response.json();

        // Filter out past time slots for today
        const selectedDate = new Date(dateString);
        const isToday = selectedDate.getFullYear() === currentYear &&
                        selectedDate.getMonth() === currentMonth &&
                        selectedDate.getDate() === currentDate;

        if (isToday) {
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            
            slots = slots.filter(time => {
                const [hour, minutes] = time.split(':').map(Number);
                if (hour > currentHour) {
                    return true; // Slot is in a future hour
                }
                if (hour === currentHour && minutes >= currentMinutes) {
                    return true; // Slot is in the current hour but in the future
                }
                return false; // Slot is in the past
            });
        }

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
                selectedTime = time; // Update selectedTime when a slot is clicked
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

  // Initial Calendar Setup
  if (calendarGrid) {
    generateCalendar(displayedDate);

    nextMonthBtn.addEventListener("click", () => {
      displayedDate.setMonth(displayedDate.getMonth() + 1);
      generateCalendar(displayedDate);
      slotsContainer.innerHTML = '<p class="no-slots-message">Моля, изберете ден.</p>';
      selectedDate = null; // Reset selected date when month changes
      selectedTime = null; // Reset selected time when month changes
      if (currentActiveDayElement) currentActiveDayElement.classList.remove("active"); // Clear active day visually
      const activeSlot = document.querySelector(".time-slot.active");
      if (activeSlot) activeSlot.classList.remove("active"); // Clear active time slot visually
      updateSubmitButtonState();
    });

    prevMonthBtn.addEventListener("click", () => {
      displayedDate.setMonth(displayedDate.getMonth() - 1);
      generateCalendar(displayedDate);
      slotsContainer.innerHTML = '<p class="no-slots-message">Моля, изберете ден.</p>';
      selectedDate = null; // Reset selected date when month changes
      selectedTime = null; // Reset selected time when month changes
      if (currentActiveDayElement) currentActiveDayElement.classList.remove("active"); // Clear active day visually
      const activeSlot = document.querySelector(".time-slot.active");
      if (activeSlot) activeSlot.classList.remove("active"); // Clear active time slot visually
      updateSubmitButtonState();
    });

    // Initial selection of the first available day
    const firstAvailableDay = document.querySelector(".calendar-grid .day:not(.disabled)");
    if (firstAvailableDay) {
      firstAvailableDay.click();
    } else {
      slotsContainer.innerHTML = `<p class="no-slots-message">Няма налични дни този месец.</p>`;
      updateSubmitButtonState();
    }
  }

 // ==========================================
// 4. BOOKING FORM + BACKEND CONNECTION
// ==========================================

const form = document.getElementById("bookingForm");
const confirmBox = document.getElementById("confirmBox");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function isValidPhone(phone) {
  const normalized = normalizePhone(phone);

  return /^08\d{8}$/.test(normalized) ||
         /^\+3598\d{8}$/.test(normalized) ||
         /^3598\d{8}$/.test(normalized);
}

function isValidEmail(email) {
  const trimmed = String(email || "").trim();

  if (!trimmed) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

if (form && confirmBox) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Final check for selected date and time
    if (!selectedDate || !selectedTime) {
      alert("Моля, изберете дата и час.");
      return;
    }

    const formData = new FormData(form);
    const phone = formData.get("phone");
    const email = formData.get("email");

    if (!isValidPhone(phone)) {
      alert("Моля, въведете валиден телефонен номер. Пример: 0888123456 или +359888123456.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Моля, въведете валиден имейл адрес или оставете полето празно.");
      return;
    }

    const booking = {
      name: formData.get("name"),
      phone: phone,
      email: String(email || "").trim(),
      service: formData.get("service"),
      date: selectedDate,
      time: selectedTime,
      note: formData.get("note"),
    };

    // Disable button to prevent multiple submissions
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(`${apiHost}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem(customerTokenKey)
            ? { Authorization: `Bearer ${localStorage.getItem(customerTokenKey)}` }
            : {}),
        },
        body: JSON.stringify(booking),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Грешка при запазване на часа.");
        if (submitBtn) submitBtn.disabled = false; // Re-enable on error
        return;
      }

      // On Success
      form.classList.add("hide");
      confirmBox.classList.add("show");

    } catch (error) {
      console.error("Booking submission error:", error);
      alert("Грешка при свързване със сървъра. Моля, опитайте отново.");
      if (submitBtn) submitBtn.disabled = false; // Re-enable on error
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
