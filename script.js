document.addEventListener("DOMContentLoaded", () => {
    const toggleDark = () => {
      document.body.classList.toggle("dark-mode");
    };

    const db = window.db;
const storage = window.storage;

  
    document.addEventListener("keydown", e => {
      if (e.shiftKey && e.key.toLowerCase() === "d") toggleDark();
    });
  
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "다크모드";
    toggleBtn.style.position = "fixed";
    toggleBtn.style.top = "1rem";
    toggleBtn.style.right = "1rem";
    toggleBtn.style.padding = "0.6rem 1rem";
    toggleBtn.style.background = "black";
    toggleBtn.style.color = "white";
    toggleBtn.style.border = "none";
    toggleBtn.style.borderRadius = "999px";
    toggleBtn.style.zIndex = "10000";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.addEventListener("click", toggleDark);
    document.body.appendChild(toggleBtn);
  
    const modal = document.createElement("div");
    modal.id = "modal";
    modal.style.position = "fixed";
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(0,0,0,0.8)";
    modal.style.display = "none";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.flexDirection = "column";
    modal.style.zIndex = "9999";
    modal.innerHTML = `
      <span id="modal-close" style="position:absolute;top:1rem;right:1.5rem;font-size:2rem;color:white;cursor:pointer">&times;</span>
      <img id="modal-img" src="" alt="modal" style="max-width:90vw; max-height:70vh; border-radius:1rem;" />
      <h4 id="modal-title" style="color:white;margin-top:1rem;font-size:1.2rem;"></h4>
    `;
    document.body.appendChild(modal);
  
    const modalImg = document.getElementById("modal-img");
    const modalTitle = document.getElementById("modal-title");
    const modalClose = document.getElementById("modal-close");
  
    document.querySelectorAll(".gallery-card img").forEach(img => {
      img.addEventListener("click", () => {
        const title = img.closest(".gallery-card").querySelector("h4")?.textContent || "";
        modalImg.src = img.src;
        modalTitle.textContent = title;
        modal.style.display = "flex";
      });
    });
  
    modalClose.addEventListener("click", () => {
      modal.style.display = "none";
    });
  
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });
  