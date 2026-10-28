/**
 * Leather Touch Dharavi — Master Artisan Web Application
 * Strict 25-Kilometer Delivery Geofence Engine
 */

const DHARAVI_COORDS = {
  lat: 19.0435,
  lng: 72.8570,
  name: "Kala Killa, Dharavi, Mumbai",
  maxRadiusKm: 25.0
};

const MUMBAI_PINCODES = {
  "400017": { name: "Dharavi / Sion", distanceKm: 0.3 },
  "400051": { name: "BKC Bandra Kurla Complex", distanceKm: 2.1 },
  "400050": { name: "Bandra West", distanceKm: 3.5 },
  "400028": { name: "Dadar West", distanceKm: 3.8 },
  "400013": { name: "Lower Parel / High Street Phoenix", distanceKm: 6.0 },
  "400018": { name: "Worli Sea Face", distanceKm: 7.2 },
  "400069": { name: "Andheri East", distanceKm: 9.8 },
  "400001": { name: "Fort / Colaba", distanceKm: 13.5 },
  "400092": { name: "Borivali West", distanceKm: 18.5 },
  "400703": { name: "Vashi, Navi Mumbai", distanceKm: 17.8 },
  "400601": { name: "Thane West", distanceKm: 21.4 },
  "421301": { name: "Kalyan City", distanceKm: 36.0 },
  "410206": { name: "Panvel Outer", distanceKm: 38.5 }
};

const LEATHER_CATALOG = [
  {
    id: "LT-JKT-RACER",
    type: "Tailored Leather Jacket",
    name: "The Kala Killa Cafe Racer",
    desc: "Supple drum-dyed black nappa lambskin. Antiqued brass YKK #10 zip, mandarin collar with snap button, and hand-stitched diamond quilted shoulder pads.",
    price: 8999,
    leather: "100% Full-Grain Lambskin (1.1mm)",
    hardware: "Solid Antiqued Cast Brass"
  },
  {
    id: "LT-BAG-MESSENGER",
    type: "Executive Workwear",
    name: "The BKC Executive Briefcase",
    desc: "Heavy waxed pull-up buffalo hide. Houses 15.6-inch laptop with high-density neoprene padding, twin gusseted document compartments, and detachable shoulder strap.",
    price: 4850,
    leather: "Oiled Full-Grain Buffalo Hide (2.0mm)",
    hardware: "Solid Brass Roller Buckles"
  },
  {
    id: "LT-BAG-DUFFEL",
    type: "Heritage Travel",
    name: "The Grand Explorer Weekend Duffel",
    desc: "Roomy 45-liter carry-on compliant duffel. Reinforced double top handles with copper rivets, full-length double zipper, and waterproof twill lining.",
    price: 5999,
    leather: "Vegetable-Tanned Buffalo Grain",
    hardware: "Heavy-Duty YKK Brass Dual Sliders"
  },
  {
    id: "LT-ACC-WALLET",
    type: "Daily Heirloom",
    name: "The Artisan Biker Bi-Fold Wallet",
    desc: "Traditional saddle-stitched bi-fold with 8 card slots, dual currency sleeves, and solid brass lanyard ring. Burnished beeswax edges that never fray.",
    price: 1450,
    leather: "Full-Grain Saddle Tan Hide",
    hardware: "Brass Lanyard Eyelet"
  }
];

let appState = {
  currentDistanceKm: 0.3, // Default: Dharavi local
  isEligibleForDelivery: true,
  cart: []
};

// Haversine
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return parseFloat((R * c).toFixed(1));
}

function updateGeofenceNotice() {
  const notice = document.getElementById("geoNotice");
  if (!notice) return;

  const isEligible = appState.currentDistanceKm <= DHARAVI_COORDS.maxRadiusKm;
  appState.isEligibleForDelivery = isEligible;

  notice.classList.remove("hidden", "valid", "invalid");

  if (isEligible) {
    notice.classList.add("valid");
    notice.innerHTML = `
      <span>✓ <strong>Within 25 KM Workshop Boundary:</strong> Your location is approx <strong>${appState.currentDistanceKm} km</strong> from Kala Killa, Dharavi. You are <strong>eligible for same-day express workshop hand-delivery!</strong></span>
    `;
  } else {
    notice.classList.add("invalid");
    notice.innerHTML = `
      <span>⚠️ <strong>Outside 25 KM Express Boundary:</strong> Your location is approx <strong>${appState.currentDistanceKm} km</strong> away. Express local direct delivery is restricted to 25 km of Dharavi. Please select national Blue Dart courier delivery or visit our Dharavi cutting bench.</span>
    `;
  }
  updateCartGeoLock();
}

function renderCatalog() {
  const container = document.getElementById("productGrid");
  if (!container) return;

  container.innerHTML = LEATHER_CATALOG.map(p => `
    <article class="product-tile">
      <div>
        <span class="product-type">${p.type}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-meta">
          <div>Hide: ${p.leather}</div>
          <div>Hardware: ${p.hardware}</div>
        </div>
      </div>
      <div class="product-bottom">
        <div>
          <span style="font-size:0.75rem; color:var(--text-dim); display:block;">BENCH PRICE</span>
          <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
        </div>
        <button class="btn btn-primary btn-sm btn-add-bag" data-id="${p.id}">
          Add to Bag
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".btn-add-bag").forEach(b => {
    b.addEventListener("click", () => {
      const pid = b.getAttribute("data-id");
      addToBag(pid);
    });
  });
}

function addToBag(productId) {
  const prod = LEATHER_CATALOG.find(x => x.id === productId);
  if (!prod) return;

  appState.cart.push({ ...prod, snapshotPrice: prod.price });
  document.getElementById("cartCount").textContent = appState.cart.length;
  alert(`Added "${prod.name}" to your Artisan Bag.`);
}

function openCart() {
  const modal = document.getElementById("cartModal");
  const list = document.getElementById("cartItemsList");
  const totalRow = document.getElementById("cartTotalRow");
  const totalPrice = document.getElementById("cartTotalPrice");
  const checkoutForm = document.getElementById("checkoutForm");

  if (appState.cart.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:1.5rem;">Your artisan bag is currently empty.</p>`;
    totalRow.style.display = "none";
    checkoutForm.style.display = "none";
  } else {
    let grandTotal = 0;
    list.innerHTML = appState.cart.map((item, idx) => {
      grandTotal += item.snapshotPrice;
      return `
        <div class="cart-item-row">
          <div>
            <strong>${item.name}</strong><br>
            <span style="font-size:0.78rem; color:var(--text-dim);">${item.leather}</span>
          </div>
          <div>
            <span style="font-weight:700; color:var(--leather-gold);">₹${item.snapshotPrice.toLocaleString('en-IN')}</span>
            <button onclick="removeCartItem(${idx})" style="background:none; border:none; color:#ef4444; margin-left:0.5rem; cursor:pointer;">&times;</button>
          </div>
        </div>
      `;
    }).join("");

    totalRow.style.display = "flex";
    totalPrice.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
    checkoutForm.style.display = "block";
  }

  updateCartGeoLock();
  modal.classList.remove("hidden");
}

window.removeCartItem = function(idx) {
  appState.cart.splice(idx, 1);
  document.getElementById("cartCount").textContent = appState.cart.length;
  openCart();
};

function updateCartGeoLock() {
  const alertBox = document.getElementById("cartGeoAlert");
  const btnOrder = document.getElementById("btnPlaceOrder");
  if (!alertBox || !btnOrder) return;

  if (appState.currentDistanceKm > DHARAVI_COORDS.maxRadiusKm) {
    alertBox.classList.remove("hidden");
    alertBox.innerHTML = `
      <strong>⚠️ 25 KM Delivery Radius Exceeded:</strong> Your detected distance is <strong>${appState.currentDistanceKm} km</strong> from Dharavi.
      Direct local workshop courier dispatch is restricted to 25 km. Checkout is disabled. Please contact us for standard Blue Dart postal delivery.
    `;
    btnOrder.disabled = true;
    btnOrder.style.opacity = "0.5";
  } else {
    alertBox.classList.add("hidden");
    btnOrder.disabled = false;
    btnOrder.style.opacity = "1";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderCatalog();

  // Monogram live preview
  const monoInput = document.getElementById("monogramInput");
  const monoOutput = document.getElementById("embossedOutput");
  if (monoInput && monoOutput) {
    monoInput.addEventListener("input", (e) => {
      monoOutput.textContent = e.target.value.toUpperCase() || "LT";
    });
  }

  // Pincode dropdown
  const pinSelect = document.getElementById("mumbaiPinSelect");
  if (pinSelect) {
    pinSelect.addEventListener("change", (e) => {
      const pin = e.target.value;
      if (pin && MUMBAI_PINCODES[pin]) {
        appState.currentDistanceKm = MUMBAI_PINCODES[pin].distanceKm;
        updateGeofenceNotice();
      }
    });
  }

  // GPS Button
  const btnGps = document.getElementById("btnGps");
  if (btnGps) {
    btnGps.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported by browser. Please choose Mumbai Pincode.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = calculateHaversine(DHARAVI_COORDS.lat, DHARAVI_COORDS.lng, pos.coords.latitude, pos.coords.longitude);
          appState.currentDistanceKm = d;
          updateGeofenceNotice();
        },
        () => alert("GPS access denied. Select Mumbai Pincode instead.")
      );
    });
  }

  // Cart open/close
  document.getElementById("cartBtn")?.addEventListener("click", openCart);
  document.getElementById("closeCartBtn")?.addEventListener("click", () => {
    document.getElementById("cartModal").classList.add("hidden");
  });

  // Checkout submit
  document.getElementById("checkoutForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (appState.currentDistanceKm > DHARAVI_COORDS.maxRadiusKm) {
      alert("Order rejected: Address is outside the 25km local workshop radius.");
      return;
    }

    const name = document.getElementById("cName").value;
    const phone = document.getElementById("cPhone").value;
    const address = document.getElementById("cAddress").value;
    const orderNo = `LT-${Math.floor(1000 + Math.random() * 9000)}`;

    let total = appState.cart.reduce((acc, curr) => acc + curr.snapshotPrice, 0);

    const orderRecord = {
      orderNo,
      items: appState.cart.map(c => c.name).join(", "),
      total,
      name,
      phone,
      address,
      distanceKm: appState.currentDistanceKm,
      status: "Workshop Messenger Queued",
      date: new Date().toISOString()
    };

    const orders = JSON.parse(localStorage.getItem("lt_orders") || "[]");
    orders.push(orderRecord);
    localStorage.setItem("lt_orders", JSON.stringify(orders));

    alert(`Order ${orderNo} placed successfully! Direct workshop delivery scheduled to ${address} (${appState.currentDistanceKm} km away).`);
    appState.cart = [];
    document.getElementById("cartCount").textContent = "0";
    document.getElementById("cartModal").classList.add("hidden");
  });

  // Bespoke form submit
  document.getElementById("bespokeForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("bName").value;
    const phone = document.getElementById("bPhone").value;
    const prod = document.getElementById("bProduct").value;
    const notes = document.getElementById("bNotes").value;

    const inquiries = JSON.parse(localStorage.getItem("lt_bespoke") || "[]");
    inquiries.push({ name, phone, prod, notes, date: new Date().toISOString() });
    localStorage.setItem("lt_bespoke", JSON.stringify(inquiries));

    alert(`Thank you ${name}! Our master craftsman will call you on ${phone} to confirm measurements and leather selection.`);
    document.getElementById("bespokeForm").reset();
  });

  // Owner Portal
  document.getElementById("ownerBtn")?.addEventListener("click", () => {
    document.getElementById("ownerModal").classList.remove("hidden");
  });
  document.getElementById("closeOwnerBtn")?.addEventListener("click", () => {
    document.getElementById("ownerModal").classList.add("hidden");
  });

  document.getElementById("btnOwnerLogin")?.addEventListener("click", () => {
    const pin = document.getElementById("ownerPin").value;
    if (pin === "1234") {
      document.getElementById("ownerAuth").classList.add("hidden");
      document.getElementById("ownerDashboard").classList.remove("hidden");
      loadOwnerDashboard();
    } else {
      document.getElementById("ownerPinErr").classList.remove("hidden");
    }
  });
});

function loadOwnerDashboard() {
  const orders = JSON.parse(localStorage.getItem("lt_orders") || "[]");
  const bespoke = JSON.parse(localStorage.getItem("lt_bespoke") || "[]");

  document.getElementById("dashOrderCount").textContent = orders.length;
  document.getElementById("dashBespokeCount").textContent = bespoke.length;

  const rows = document.getElementById("ownerOrderRows");
  rows.innerHTML = orders.length ? orders.map(o => `
    <tr>
      <td><strong>${o.orderNo}</strong></td>
      <td>${o.items}</td>
      <td>₹${o.total.toLocaleString('en-IN')}</td>
      <td>${o.name} (${o.phone})</td>
      <td>${o.distanceKm} km</td>
      <td><span style="color:#10b981;">${o.status}</span></td>
    </tr>
  `).join("") : `<tr><td colspan="6" style="text-align:center; color:var(--text-dim);">No orders logged yet.</td></tr>`;
}
