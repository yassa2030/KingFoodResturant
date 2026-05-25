/* =======================
   SEARCH ELEMENTS
======================= */
const searchicon1 = document.querySelector("#searchicon1");
const search1 = document.querySelector("#searchinput1");

const searchicon2 = document.querySelector("#searchicon2");
const search2 = document.querySelector("#searchinput2");

/* =======================
   MOBILE MENU
======================= */
const bar = document.querySelector(".fa-bars");
const cross = document.querySelector("#hdcross");
const headerbar = document.querySelector(".headerbar");

/* =======================
   FOOD MENU API
======================= */
const API_BASE = "https://free-food-menus-api-two.vercel.app";

const categories = [
  { name: "Pizza", image: "plate5.jpg", url: `${API_BASE}/pizzas` },
  { name: "Burger", image: "usa.jpg", url: `${API_BASE}/burgers` },

  { name: "BBQ", image: "K.jpg", url: `${API_BASE}/bbqs` },
  { name: "Drinks", image: "download.jpg", url: `${API_BASE}/drinks` },
];

const container = document.querySelector(".menu-categories");

/* =======================
   SEARCH FIX
======================= */
if (searchicon1 && search1) {
  searchicon1.onclick = () => {
    search1.style.display = "flex";
    searchicon1.style.display = "none";
  };
}

if (searchicon2 && search2) {
  searchicon2.onclick = () => {
    search2.style.display = "flex";
    searchicon2.style.display = "none";
  };
}

/* =======================
   SEARCH FUNCTIONALITY
======================= */
let allFoodItems = [];

// Add search input event listeners
const searchInputs = document.querySelectorAll(".search input");
searchInputs.forEach((input) => {
  input.addEventListener("input", handleSearch);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  });
});

async function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase().trim();

  if (searchTerm.length < 2) return;

  // Open food menu if not already open
  const foodSection = document.querySelector(".food-items");
  const homeSection = document.querySelector(".main_slide");

  if (homeSection && homeSection.style.display !== "none") {
    openFoodMenu();
  }

  // Fetch all categories if not already loaded
  if (allFoodItems.length === 0) {
    await loadAllFoodItems();
  }

  // Search through all food items
  const results = allFoodItems.filter(
    (food) =>
      food.name.toLowerCase().includes(searchTerm) ||
      (food.dsc && food.dsc.toLowerCase().includes(searchTerm)),
  );

  displaySearchResults(results, searchTerm);
}

async function loadAllFoodItems() {
  allFoodItems = [];

  for (const category of categories) {
    try {
      const res = await fetch(category.url);
      const foods = await res.json();

      foods.forEach((food) => {
        food.category = category.name;
        allFoodItems.push(food);
      });
    } catch (err) {
      console.error(`Failed to load ${category.name}:`, err);
    }
  }
}

function displaySearchResults(results, searchTerm) {
  container.innerHTML = `
        <div style="width:100%;text-align:center;margin-bottom:20px;">
            <button class="white_btn" id="backBtn">⬅ Back to Categories</button>
            <h2 style="margin-top:10px;">Search Results for "${searchTerm}"</h2>
            <p style="font-size:14px;color:#666;">Found ${results.length} item(s)</p>
        </div>
    `;

  document.getElementById("backBtn").onclick = showCategories;

  if (results.length === 0) {
    container.innerHTML += `
            <div style="text-align:center;padding:40px;width:100%;">
                <i class="fa-solid fa-search" style="font-size:50px;color:#ccc;margin-bottom:20px;"></i>
                <h3 style="color:#666;">No items found</h3>
                <p style="color:#999;">Try searching for a different food item</p>
            </div>
        `;
    return;
  }

  results.forEach((food) => {
    const item = document.createElement("div");
    item.className = "item";

    const img =
      food.img ||
      food.image ||
      food.thumbnail ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

    item.innerHTML = `
            <div style="height:180px;overflow:hidden;border-radius:10px;">
                <img src="${img}"
                    style="width:100%;height:100%;object-fit:cover;"
                    onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'">
            </div>
            
            <h3>${food.name}</h3>
            <p style="font-size:11px;color:rgb(176,34,32);">${food.category}</p>
            
            <p style="font-size:12px;color:#666;">
                ${food.dsc ? food.dsc.slice(0, 80) + "..." : "Fresh delicious meal"}
            </p>
            
            <h4 style="color:rgb(176,34,32);">
                $${food.price || "N/A"}
            </h4>
        `;

    container.appendChild(item);
  });
}

/* =======================
   MOBILE MENU FIX (IMPORTANT)
======================= */
if (bar && headerbar) {
  bar.onclick = () => {
    headerbar.style.right = "0%";
    cross.style.display = "block";
  };
}

if (cross && headerbar) {
  cross.onclick = () => {
    headerbar.style.right = "-100%";
    cross.style.display = "none";
  };
}

/* =======================
   SHOW FOOD MENU (FIX FOR MOBILE)
======================= */
// Only apply this on project.html (home page) for the "View Menu" buttons
if (
  window.location.pathname.includes("project.html") ||
  window.location.pathname === "/"
) {
  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.textContent.trim() === "Food Menu") {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "menu.html";
      });
    }
  });
}

/* =======================
   SHOW CATEGORIES
======================= */
function showCategories() {
  container.innerHTML = "";
  container.className = "menu-categories";

  categories.forEach((cat) => {
    const card = document.createElement("div");
    card.className = "category-card";

    card.innerHTML = `
            <div class="image-wrapper">
                <img src="${cat.image}"
                    onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'">
            </div>
            <h3>${cat.name}</h3>
            <button class="red_btn">View Menu</button>
        `;

    card.querySelector("button").onclick = () => loadFoods(cat);

    container.appendChild(card);
  });
}

/* =======================
   LOAD FOODS (FIXED IMAGES)
======================= */
async function loadFoods(category) {
  container.innerHTML = `
        <div class="menu-header-controls">
            <button class="white_btn" id="backBtn">⬅ Back</button>
            <h2>${category.name}</h2>
        </div>
    `;
  container.className = "menu-items";

  document.getElementById("backBtn").onclick = showCategories;

  try {
    const res = await fetch(category.url);
    const foods = await res.json();

    foods.forEach((food) => {
      const item = document.createElement("div");
      item.className = "food-item";

      const img =
        food.img ||
        food.image ||
        food.thumbnail ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

      item.innerHTML = `
                <div class="image-wrapper">
                    <img src="${img}"
                        onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'">
                </div>
                <h3>${food.name}</h3>
                <p class="category-tag">${category.name}</p>
                <p class="description">
                    ${food.dsc ? food.dsc.slice(0, 80) + "..." : "Fresh delicious meal"}
                </p>
                <p class="price">$${food.price || "N/A"}</p>
            `;

      container.appendChild(item);
    });
  } catch (err) {
    container.innerHTML += `
            <p style="color:red;text-align:center;width:100%;grid-column:1/-1;">
                Failed to load food data
            </p>
        `;
  }
}

function openFoodMenu() {
  const foodSection = document.querySelector(".food-items");
  const homeSection = document.querySelector(".main_slide");

  if (homeSection) homeSection.style.display = "none";
  if (foodSection) foodSection.style.display = "flex";

  showCategories();

  // قفل الموبايل منيو بعد الفتح
  if (headerbar) headerbar.style.right = "-100%";
  if (cross) cross.style.display = "none";
}

/* =======================
   LOAD MENU ON MENU.HTML PAGE
======================= */
// Automatically load categories when on menu.html page
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, checking if on menu page...");
  const container = document.querySelector(".menu-categories");

  if (container && window.location.pathname.includes("menu.html")) {
    console.log("On menu page, calling showCategories()");
    console.log("Container found:", container);
    console.log("Categories data:", categories);
    showCategories();
  }
});
