// --- State Management ---
let currentUser = JSON.parse(localStorage.getItem("agriUser")) || null;
let commodities =
    JSON.parse(localStorage.getItem("agriCommodities")) || [];

// Add mock data if completely empty to show functionality immediately
if (commodities.length === 0) {
    commodities.push({
        id: Date.now().toString(),
        farmerName: "Demo Farmer",
        name: "Wheat",
        quantity: 50,
        unit: "Quintals",
        price: 2200,
        district: "Pune",
        state: "Maharashtra",
        terms: "Buyer arranges transport from farm.",
        bids: [
            {
                price: 2250,
                quantity: 20,
                contactName: "Demo Buyer",
                contactDetails: "demo@buyer.com",
            },
        ],
    });
    saveCommodities();
}

function saveCommodities() {
    localStorage.setItem("agriCommodities", JSON.stringify(commodities));
}

// --- DOM Elements ---
const loginView = document.getElementById("login-view");
const mainHeader = document.getElementById("main-header");
const farmerDashboard = document.getElementById("farmer-dashboard");
const buyerDashboard = document.getElementById("buyer-dashboard");
const userGreeting = document.getElementById("user-greeting");

// --- Initialization ---
function init() {
    if (currentUser) {
        showDashboard();
    } else {
        loginView.classList.remove("hidden");
        mainHeader.classList.add("hidden");
        farmerDashboard.classList.add("hidden");
        buyerDashboard.classList.add("hidden");
    }
}

// --- Auth Logic ---
document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("username").value;
    const role = document.querySelector('input[name="role"]:checked').value;
    currentUser = { name, role };
    localStorage.setItem("agriUser", JSON.stringify(currentUser));
    showDashboard();
});

document.getElementById("logout-btn").addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("agriUser");
    init();
});

function showDashboard() {
    loginView.classList.add("hidden");
    mainHeader.classList.remove("hidden");
    userGreeting.innerText = `Hello, ${currentUser.name} (${currentUser.role})`;

    if (currentUser.role === "farmer") {
        farmerDashboard.classList.remove("hidden");
        buyerDashboard.classList.add("hidden");
        renderFarmerCommodities();
    } else {
        buyerDashboard.classList.remove("hidden");
        farmerDashboard.classList.add("hidden");
        renderBuyerCommodities();
    }
}

// --- Utility Functions ---
function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
}

// --- Farmer Logic ---
document
    .getElementById("add-commodity-form")
    .addEventListener("submit", (e) => {
        e.preventDefault();
        const newComm = {
            id: Date.now().toString(),
            farmerName: currentUser.name,
            name: document.getElementById("comm-name").value,
            quantity: document.getElementById("comm-qty").value,
            unit: document.getElementById("comm-unit").value,
            price: document.getElementById("comm-price").value,
            district: document.getElementById("comm-district").value,
            state: document.getElementById("comm-state").value,
            terms: document.getElementById("comm-terms").value,
            bids: [],
        };
        commodities.push(newComm);
        saveCommodities();
        closeModal("add-commodity-modal");
        e.target.reset();
        renderFarmerCommodities();
    });

function deleteCommodity(id) {
    commodities = commodities.filter((c) => c.id !== id);
    saveCommodities();
    renderFarmerCommodities();
}

function viewCommodityDetails(id) {
    const comm = commodities.find((c) => c.id === id);
    document.getElementById("view-comm-title").innerText =
        `${comm.name} - Details`;
    document.getElementById("view-comm-details").innerHTML = `
                <p><strong>Inventory:</strong> ${comm.quantity} ${comm.unit}</p>
                <p><strong>Min Price:</strong> ₹${comm.price} / ${comm.unit}</p>
                <p><strong>Location:</strong> ${comm.district}, ${comm.state}</p>
                <p><strong>Terms:</strong> ${comm.terms}</p>
            `;

    const bidsContainer = document.getElementById("view-comm-bids");
    bidsContainer.innerHTML = "";

    if (comm.bids.length === 0) {
        bidsContainer.innerHTML = "<p>No bids yet.</p>";
    } else {
        // Sort bids highest to lowest
        const sortedBids = [...comm.bids].sort((a, b) => b.price - a.price);
        sortedBids.forEach((bid) => {
            bidsContainer.innerHTML += `
                        <div class="bid-item">
                            <div>
                                <strong>${bid.contactName}</strong><br>
                                <small>${bid.contactDetails} | Qty Req: ${bid.quantity}</small>
                            </div>
                            <div class="bid-price">₹${bid.price}</div>
                        </div>
                    `;
        });
    }
    openModal("view-commodity-modal");
}

function renderFarmerCommodities() {
    const list = document.getElementById("farmer-commodity-list");
    list.innerHTML = "";
    const myCommodities = commodities.filter(
        (c) => c.farmerName === currentUser.name,
    );

    myCommodities.forEach((comm) => {
        const highestBid =
            comm.bids.length > 0
                ? Math.max(...comm.bids.map((b) => b.price))
                : "None";
        list.innerHTML += `
                    <div class="card">
                        <h3>${comm.name}</h3>
                        <p><strong>Quantity:</strong> ${comm.quantity} ${comm.unit}</p>
                        <p><strong>Min Price:</strong> ₹${comm.price}</p>
                        <p><strong>Highest Bid:</strong> ${highestBid !== "None" ? "₹" + highestBid : "None"}</p>
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="btn btn-outline" onclick="viewCommodityDetails('${comm.id}')">View Details & Bids</button>
                            <button class="btn btn-danger" onclick="deleteCommodity('${comm.id}')">Delete</button>
                        </div>
                    </div>
                `;
    });
}

// --- Buyer Logic ---
function handleSearch() {
    const term = document.getElementById("search-bar").value.toLowerCase();
    renderBuyerCommodities(term);
}

function toggleBidForm(id) {
    const form = document.getElementById(`bid-form-${id}`);
    form.classList.toggle("hidden");
}

function submitBid(id) {
    const price = document.getElementById(`bid-price-${id}`).value;
    const qty = document.getElementById(`bid-qty-${id}`).value;
    const contact = document.getElementById(`bid-contact-${id}`).value;

    if (!price || !qty || !contact) {
        alert("Please fill all bid details.");
        return;
    }

    const commIndex = commodities.findIndex((c) => c.id === id);
    commodities[commIndex].bids.push({
        price: parseFloat(price),
        quantity: parseFloat(qty),
        contactName: currentUser.name,
        contactDetails: contact,
    });

    saveCommodities();
    renderBuyerCommodities(
        document.getElementById("search-bar").value.toLowerCase(),
    );
}

function renderBuyerCommodities(searchTerm = "") {
    const list = document.getElementById("buyer-commodity-list");
    list.innerHTML = "";

    const filteredCommodities = commodities.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.district.toLowerCase().includes(searchTerm),
    );

    filteredCommodities.forEach((comm) => {
        // Render previous bids
        const sortedBids = [...comm.bids].sort((a, b) => b.price - a.price);
        let bidsHTML =
            sortedBids.length > 0
                ? `<div class="bids-list"><strong>Current Bids:</strong>`
                : '<div class="bids-list">No bids yet.';
        sortedBids.forEach((bid) => {
            bidsHTML += `
                        <div class="bid-item">
                            <span>${bid.contactName}</span>
                            <span class="bid-price">₹${bid.price}</span>
                        </div>
                    `;
        });
        bidsHTML += `</div>`;

        list.innerHTML += `
                    <div class="card">
                        <h3>${comm.name} <small style="color:var(--text-muted); font-size: 0.8rem;">by ${comm.farmerName}</small></h3>
                        <p><strong>Available:</strong> ${comm.quantity} ${comm.unit}</p>
                        <p><strong>Min Price:</strong> ₹${comm.price} / ${comm.unit}</p>
                        <p><strong>Location:</strong> ${comm.district}, ${comm.state}</p>
                        <p><strong>Terms:</strong> <small>${comm.terms}</small></p>
                        
                        ${bidsHTML}

                        <button class="btn btn-primary" style="margin-top: 15px; width: 100%;" onclick="toggleBidForm('${comm.id}')">Bid Now</button>
                        
                        <div id="bid-form-${comm.id}" class="bid-input-row hidden">
                            <input type="number" id="bid-price-${comm.id}" placeholder="Your Bid Price (₹)" required>
                            <input type="number" id="bid-qty-${comm.id}" placeholder="Quantity Required" required>
                            <input type="text" id="bid-contact-${comm.id}" placeholder="Your Phone/Email" required>
                            <button class="btn btn-primary" style="width: 100%;" onclick="submitBid('${comm.id}')">Submit Bid</button>
                        </div>
                    </div>
                `;
    });
}

// Boot up
init();
