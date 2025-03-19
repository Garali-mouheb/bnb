document.addEventListener("DOMContentLoaded", function () {
  // Get all sections that have an ID defined
  const sections = document.querySelectorAll("section[id], div[id]");
  const navLinks = document.querySelectorAll(".nav-section");

  // Add an event listener listening for scroll
  window.addEventListener("scroll", navHighlighter);

  function navHighlighter() {
    // Get current scroll position
    let scrollY = window.pageYOffset;

    // Now we loop through sections to get height, top and ID values for each
    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 400; // Adjust offset as needed
      const sectionId = current.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        // Remove active class from all nav items
        navLinks.forEach((link) => link.classList.remove("active"));

        // Add active class to corresponding nav item
        document
          .querySelector(`.nav-section[href*=${sectionId}]`)
          .classList.add("active");
      }
    });
  }

  // Smooth scrolling when clicking nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        const targetSection = document.querySelector(targetId);
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Get the back to top button
  const backToTopBtn = document.querySelector(".back-to-top");

  backToTopBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Remove active class from all nav items
    document.querySelectorAll(".nav-section").forEach((item) => {
      item.classList.remove("active");
    });

    // Add active class to home nav item
    document
      .querySelector('.nav-section[data-section="home"]')
      .classList.add("active");
  });
});
