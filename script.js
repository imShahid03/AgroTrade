/// sheets part 

const API_URL =
    "https://script.google.com/macros/s/AKfycbxM3MAqAv_sAIU4wCHm8p44SX-W3icNF1Ultvb0DVo6kc1XREs-wdQijV_OK49rFvRw/exec";
////bids 

async function saveBidToSheet(bidData) {

    const formData = new FormData();

    formData.append(
        "data",
        JSON.stringify({

            action: "addBid",

            data: bidData
        })
    );

    await fetch(API_URL, {

        method: "POST",

        body: formData
    });
}
/* ================= STATE ================= */

let currentUser =
    JSON.parse(localStorage.getItem("agriUser")) || null;

let commodities = [];


/* ================= STORAGE ================= */

async function saveCommodityToSheet(data) {

    const formData = new FormData();

    formData.append(
        "data",
        JSON.stringify({

            action: "addCommodity",

            data: data
        })
    );

    await fetch(API_URL, {

        method: "POST",

        body: formData
    });
}

/* ================= DOM ELEMENTS ================= */

const loginView =
    document.getElementById("login-view");

const mainHeader =
    document.getElementById("main-header");

const farmerDashboard =
    document.getElementById("farmer-dashboard");

const buyerDashboard =
    document.getElementById("buyer-dashboard");

const userGreeting =
    document.getElementById("user-greeting");

async function fetchCommodities() {

    try {

        const response =
            await fetch(
                API_URL +
                "?action=getCommodities"
            );

        const data =
            await response.json();

        commodities = data;

        console.log("Loaded Commodities:", commodities);

    } catch (error) {

        console.error(
            "Commodity Fetch Error:",
            error
        );
    }
}

/* ================= INIT ================= */

async function init() {
    await fetchCommodities();

    if (currentUser) {

        showDashboard();

    } else {

        loginView.classList.remove("hidden");

        mainHeader.classList.add("hidden");

        farmerDashboard.classList.add("hidden");

        buyerDashboard.classList.add("hidden");
    }
}

/* ================= AUTH ================= */

async function saveUserToSheet(userData) {

    const formData = new FormData();

    formData.append(
        "data",
        JSON.stringify({
            action: "addUser",
            data: userData
        })
    );


    await fetch(API_URL, {

        method: "POST",

        body: formData

    });
}
async function findUserByMobile(mobile) {

    const response =
        await fetch(
            `${API_URL}?action=findUser&mobile=${mobile}`
        );

    return await response.json();
}
document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("username").value;

        const mobile =
            document.getElementById("mobile").value;

        const pin =
            document.getElementById("pin").value;

        const role =
            document.querySelector(
                'input[name="role"]:checked'
            ).value;

        const result =
            await findUserByMobile(mobile);

        // USER EXISTS

        if (result.found) {

            const existingUser =
                result.user;

            if (
                String(existingUser.pin) !== String(pin)
            ) {

                alert("Invalid PIN");

                return;
            }

            if (
                String(existingUser.role).toLowerCase() !==
                String(role).toLowerCase()
            ) {

                alert("Wrong role selected");

                return;
            }

            currentUser =
                existingUser;

            localStorage.setItem(
                "agriUser",
                JSON.stringify(currentUser)
            );

            showDashboard();

            return;
        }

        // NEW USER

        currentUser = {

            userId: "U" + Date.now(),

            name,

            mobile,

            pin,

            role
        };

        await saveUserToSheet(
            currentUser
        );

        localStorage.setItem(
            "agriUser",
            JSON.stringify(currentUser)
        );

        showDashboard();
    });
document
    .getElementById("logout-btn")
    .addEventListener("click", () => {

        currentUser = null;

        localStorage.removeItem("agriUser");

        init();
    });
document
    .getElementById("buyer-logout-btn")
    .addEventListener("click", () => {

        currentUser = null;

        localStorage.removeItem("agriUser");

        init();
    });

function showDashboard() {

    loginView.classList.add("hidden");

    mainHeader.classList.remove("hidden");

    userGreeting.innerText =
        `Hello, ${currentUser.name} (${currentUser.role})`;

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

/* ================= MODALS ================= */

function openModal(id) {

    document
        .getElementById(id)
        .classList.remove("hidden");
}

function closeModal(id) {

    document
        .getElementById(id)
        .classList.add("hidden");
}

/* ================= FARMER ================= */

document
    .getElementById("add-commodity-form")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        const newComm = {

            commodityId: "C" + Date.now(),
            farmerId: currentUser.userId,
            farmerName: currentUser.name,

            name:
                document.getElementById("comm-name").value,

            quantity:
                document.getElementById("comm-qty").value,

            unit:
                document.getElementById("comm-unit").value,

            price:
                document.getElementById("comm-price").value,

            district:
                document.getElementById("comm-district").value,

            state:
                document.getElementById("comm-state").value,

            terms:
                document.getElementById("comm-terms").value,

            bids: [],
        };

        await saveCommodityToSheet(newComm);
        commodities.push(newComm);



        closeModal("add-commodity-modal");

        e.target.reset();

        renderFarmerCommodities();
    });

function deleteCommodity(id) {

    commodities =
        commodities.filter((c) => c.commodityId !== id);


    renderFarmerCommodities();
}

function viewCommodityDetails(id) {

    const comm =
        commodities.find((c) => c.commodityId === id);

    document.getElementById(
        "view-comm-title"
    ).innerText = `Commodity Information
    ${comm.name} `;

    document.getElementById(
        "view-comm-details"
    ).innerHTML = `
    <div class="commodity-details-card">
        
        <p><strong>Inventory:</strong>
        ${comm.quantity} ${comm.unit}</p>

        <p><strong>Min Price:</strong>
        ₹${comm.price} / ${comm.unit}</p>

        <p><strong>Location:</strong>
        ${comm.district}, ${comm.state}</p>

        <p><strong>Terms:</strong>
        ${comm.terms}</p>
    </div>
    `;

    const bidsContainer =
        document.getElementById("view-comm-bids");

    bidsContainer.innerHTML = "";
    const bids = comm.bids || [];
    if (comm.bids.length === 0) {

        bidsContainer.innerHTML =
            "<p>No bids yet.</p>";

    } else {

        const sortedBids =
            [...comm.bids || []]
                .sort((a, b) => b.price - a.price);

        sortedBids.forEach((bid) => {

            bidsContainer.innerHTML += `

                <div class="bid-item">

                    <div>

                        <strong>${bid.buyerName}</strong><br>

                        <small>
                        ${bid.contact}
                        |
                        Qty Req:
                        ${bid.quantity}
                        </small>

                    </div>

                    <div class="bid-price">
                        ₹${bid.price}
                    </div>

                </div>
            `;
        });
    }

    openModal("view-commodity-modal");
}

function renderFarmerCommodities() {

    const list =
        document.getElementById("farmer-commodity-list");

    list.innerHTML = "";

    const myCommodities =
        commodities.filter(
            (c) => c.farmerName === currentUser.name
        );
    // ===== FARMER STATS =====

    const activeListings =
        myCommodities.length;

    let totalBids = 0;

    let highestBid = 0;

    myCommodities.forEach(comm => {

        const bids = comm.bids || [];

        totalBids += bids.length;

        bids.forEach(bid => {

            if (bid.price > highestBid) {

                highestBid = bid.price;

            }
        });
    });

    // Update dashboard cards

    document.getElementById(
        "farmer-stats-listings"
    ).textContent = activeListings;

    document.getElementById(
        "farmer-stats-bids"
    ).textContent = totalBids;

    document.getElementById(
        "farmer-stats-highest"
    ).textContent =
        "₹" + highestBid;
    myCommodities.forEach((comm) => {

        const bids = comm.bids || [];

        const highestBid =
            bids.length > 0
                ? Math.max(...bids.map((b) => b.price))
                : "None";

        list.innerHTML += `

            <div class="card">

                <h3>${comm.name}</h3>

                <p>
                    <strong>Quantity:</strong>
                    ${comm.quantity} ${comm.unit}
                </p>

                <p>
                    <strong>Min Price:</strong>
                    ₹${comm.price}
                </p>

                <p>
                    <strong>Highest Bid:</strong>
                    ${highestBid !== "None"
                ? "₹" + highestBid
                : "None"
            }
                </p>

                <div
                    style="
                    margin-top:15px;
                    display:flex;
                    gap:10px;
                    "
                >

                    <button
                        class="btn btn-outline"
                        onclick="viewCommodityDetails('${comm.commodityId}')"
                    >
                        View Details & Bids
                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="deleteCommodity('${comm.commodityId}')"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;
    });
}

/* ================= BUYER ================= */

function handleSearch() {

    const term =
        document
            .getElementById("commodity-search")
            .value
            .toLowerCase();

    renderBuyerCommodities(term);
}

function toggleBidForm(id) {

    const form =
        document.getElementById(`bid-form-${id}`);

    form.classList.toggle("hidden");
}

async function submitBid(id) {
    console.log("price field",
        document.getElementById(`bid-price-${id}`)
    );

    console.log("qty field",
        document.getElementById(`bid-qty-${id}`)
    );

    console.log("contact field",
        document.getElementById(`bid-contact-${id}`)
    );

    const price =
        document.getElementById(`bid-price-${id}`).value;

    const qty =
        document.getElementById(`bid-qty-${id}`).value;

    const contact =
        document.getElementById(`bid-contact-${id}`).value;
    const bidData = {

        bidId: "B" + Date.now(),

        commodityId: id,

        buyerId: currentUser.userId,

        buyerName: currentUser.name,

        bidPrice: parseFloat(price),

        quantity: parseFloat(qty),

        contact: contact
    };
    if (!price || !qty || !contact) {

        alert("Please fill all bid details.");

        return;
    }

    const commIndex =
        commodities.findIndex((c) => c.commodityId === id);

    commodities[commIndex].bids.push({

        price: parseFloat(price),

        quantity: parseFloat(qty),

        buyerName: currentUser.name,

        contactDetails: contact,
    });

    await saveBidToSheet(bidData);

    renderBuyerCommodities(
        document
            .getElementById("commodity-search")
            .value
            .toLowerCase()
    );
}

function renderBuyerCommodities(searchTerm = "") {

    const list =
        document.getElementById("buyer-commodity-list");

    list.innerHTML = "";

    const filteredCommodities =
        commodities.filter(
            (c) =>
                c.name.toLowerCase().includes(searchTerm)
                ||
                c.district.toLowerCase().includes(searchTerm)
        );

    filteredCommodities.forEach((comm) => {

        const sortedBids =
            [...comm.bids || []]
                .sort((a, b) => b.price - a.price);

        let bidsHTML =
            sortedBids.length > 0
                ? `<div class="bids-list">
                    <strong>Current Bids:</strong>`
                : `<div class="bids-list">
                    No bids yet.`;

        sortedBids.forEach((bid) => {

            bidsHTML += `

                <div class="bid-item">

                    <span>${bid.buyerName}</span>

                    <span class="bid-price">
                        ₹${bid.price}
                    </span>

                </div>
            `;
        });

        bidsHTML += `</div>`;

        list.innerHTML += `

            <div class="card">

                <h3>
                    ${comm.name}

                    <small
                        style="
                        color:var(--text-muted);
                        font-size:0.8rem;
                        "
                    >
                        by ${comm.farmerName}
                    </small>

                </h3>

                <p>
                    <strong>Available:</strong>
                    ${comm.quantity} ${comm.unit}
                </p>

                <p>
                    <strong>Min Price:</strong>
                    ₹${comm.price} / ${comm.unit}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${comm.district}, ${comm.state}
                </p>

                <p>
                    <strong>Terms:</strong>

                    <small>${comm.terms}</small>
                </p>

                ${bidsHTML}

                <button
                    class="btn btn-primary"
                    style="
                    margin-top:15px;
                    width:100%;
                    "
                    onclick="toggleBidForm('${comm.commodityId}')"
                >
                    Bid Now
                </button>

                <div
                    id="bid-form-${comm.commodityId}"
                    class="bid-input-row hidden"
                >

                    <input
                        type="number"
                        id="bid-price-${comm.commodityId}"
                        placeholder="Your Bid Price (₹)"
                    >

                    <input
                        type="number"
                        id="bid-qty-${comm.commodityId}"
                        placeholder="Quantity Required"
                    >

                    <input
                        type="text"
                        id="bid-contact-${comm.commodityId}"
                        placeholder="Your Phone/Email"
                    >

                    <button
                        class="btn btn-primary"
                        style="width:100%;"
                        onclick="submitBid('${comm.commodityId}')"
                    >
                        Submit Bid
                    </button>

                </div>

            </div>
        `;
    });
}

/* ================= GLOBAL EXPORTS ================= */

window.openModal = openModal;

window.closeModal = closeModal;

window.deleteCommodity = deleteCommodity;

window.viewCommodityDetails =
    viewCommodityDetails;

window.handleSearch = handleSearch;

window.toggleBidForm = toggleBidForm;

window.submitBid = submitBid;

/* ================= START ================= */

(async () => {

    await init();

})();