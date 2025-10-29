// Search Section:-------------------------------------------------------------------------------
const searchBar = document.querySelector(".search-input");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

async function handleSearch() {
    const SearchVal = searchBar.value;
    searchResults.innerHTML = "";   // Clear old results
    const response = await fetch("/search", {  // Fetch search result from backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({Search : SearchVal}),
    })
    const data = await response.json();     console.log("From Server",data);
    
    if(data.omdb.Response=="True"){
        for(record of data.omdb.Search){  // Repopulate the search results 
            const div = document.createElement("div");
            div.classList.add("search-result-item");
            div.innerHTML = `
                <img src="${record.Poster}" alt="${record.Title}">
                <div class="info">
                    <h6>${record.Title}</h6>
                    <small>${record.Year} - ${record.Type}</small>
                </div>
            `;
            searchResults.appendChild(div);
        }
    } else {    // if no results are found.
        const div = document.createElement("div");
        div.innerHTML=`<p>No Movies/Series Found!<p>`;
        searchResults.appendChild(div);
    }
    searchResults.classList.add("show"); // Show dropdown
}
searchBtn.addEventListener("click", handleSearch)

// Hide when clicking outside
document.addEventListener("click", (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchBtn) {
        searchResults.classList.remove("show");
    }
});

// Simulate user login status
const isLoggedIn = true; // Change to true manually to test Mongo routes

// Load Data:---------------------------------------------------------------------------------------
let savedBookmarks = [];
async function loadUserBookmarks() {
    if(isLoggedIn){
        try {
            const response = await fetch("/api/bookmarks/get");
            if (!response.ok) throw new Error("Failed to fetch bookmarks");

            const result = await response.json();
            savedBookmarks = result.bookmarks || [];
            localStorage.setItem("bookmarks", JSON.stringify(savedBookmarks)); // optional cache
            console.log("Loaded bookmarks from Mongo:", savedBookmarks);
        } catch (err) {
            console.warn("Using local bookmarks cache (offline or not logged in)");
            savedBookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
        }
    } else {
        savedBookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    const page = document.body.dataset.page; // set in EJS <body data-page="trending">
    await loadUserBookmarks(); // fetch bookmarks first before loading any cards
    if (page === "trending") loadTrending(1);
    if (page === "popular") loadPopular();
    if (page === "bookmarks") loadBookmarks();
});
async function loadTrending(page){
    const response = await fetch(`/api/trending?page=${page}`);
    const data = await response.json();
    console.log("Trending data received from backend:", data);
    const results = data.data.tmdbdata.results;
    populateCards(results);
}


// Populate Cards and Handle Bookmarks:-----------------------------------------------------------
const cardContainer = document.querySelector("#cardContainer");
function populateCards(results) {
    results.forEach(record => {
        const div = document.createElement("div");
        div.classList.add("col-6", "col-md-3", "col-xl-2", "cardCont");

        const title = record.original_title || record.original_name || "Untitled";
        const date = (record.release_date!="undefined" ? (new Date(record.release_date).getFullYear()) : "N/A") || (record.first_air_date!="undefined" ? (new Date(record.first_air_date).getFullYear()) : "N/A");
        
        const data = {
            tmdbId: String(record.id),
            title,
            poster: `https://image.tmdb.org/t/p/w500${record.poster_path}`,
            year: date,
            mediaType: record.media_type,
        };
        const isBookmarked = savedBookmarks.some(b => b.tmdbId === data.tmdbId);
        const ContentId = `${data.mediaType}:${data.tmdbId}`;  // not required
        
        div.innerHTML = `
            <div class="card" style="min-width: 9rem;">
                <a href="#">
                    <img src="${data.poster}" class="card-img-top" alt="${data.title}">
                </a>
                <div class="card-body p-1">
                    <h5 class="card-title">${data.title}</h5>
                    <span class="card-text d-flex justify-content-between">
                        <span>${data.mediaType}</span>
                        <span>${data.year}</span>
                        <button class="btn btn-default p-0 bookmark-btn" type="button" data-id="${ContentId}">
                            <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
                        </button>
                    </span>
                </div>
            </div>
        `;
        
        // Handle Bookmark Button Click
        const btn = div.querySelector(".bookmark-btn");
        btn.addEventListener("click", (e) => handleBookmarks(e, btn, data));
            

        cardContainer.appendChild(div);
    });
};

async function handleBookmarks(e, btn, data) {
    e.preventDefault();
    e.stopPropagation();
    const icon = btn.querySelector("i");
    const exists = savedBookmarks.some(b => b.tmdbId === data.tmdbId);
    try {
        if (exists) {
            // --- REMOVE BOOKMARK ---
            if (isLoggedIn) {
                // For Login User
                const response = await fetch(`/api/bookmarks/delete/${data.tmdbId}`, { method: "DELETE" });
                if (response.ok) {
                    savedBookmarks = savedBookmarks.filter(b => b.tmdbId !== data.tmdbId);
                    icon.classList.replace("fa-solid", "fa-regular");
                } else {
                    console.warn("Server failed to remove bookmark");
                }
            } else {
                // For localStorage user (not logged in)
                savedBookmarks = savedBookmarks.filter(b => b.tmdbId !== data.tmdbId);
                icon.classList.replace("fa-solid", "fa-regular");
            }
        } else {
            // --- ADD BOOKMARK ---
            if(isLoggedIn){
                // For Login User
                const response = await fetch("/api/bookmarks/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (response.ok) {
                    const newBookmark = await response.json();
                    savedBookmarks.push(newBookmark.bookmark);
                    icon.classList.replace("fa-regular", "fa-solid");
                } else {
                    console.warn("Server rejected the bookmark");
                }
            } else {
                // For localStorage user (not logged in)
                savedBookmarks.push(data);
                icon.classList.replace("fa-regular", "fa-solid");
            }
        }
        // Always sync localStorage after operation
        localStorage.setItem("bookmarks", JSON.stringify(savedBookmarks));
    } catch (err) {
        console.error("Bookmark error:", err);
    }
        
}



// Handle Previous and Next Buttons:-----------------------------------------------------------
const prevBtn = document.querySelector(".PCN .Previous");
const currentBtn = document.querySelector(".PCN .Current");
const nextBtn = document.querySelector(".PCN .Next");
function CheckWebpage(newPage){  // Check which load function to call based on current webpage.
    const page = document.body.dataset.page; 
    if (page === "trending") loadTrending(newPage);
    if (page === "popular") loadPopular(newPage);
    if (page === "bookmarks") loadBookmarks(newPage);
}
nextBtn.addEventListener("click", ()=>{
    let currPage = parseInt(currentBtn.textContent);
    console.log("current page from button", currPage);
    currPage+=1;
    currentBtn.textContent = currPage;
    cardContainer.innerHTML=""; // Clear old cards
    CheckWebpage(currPage);
});
prevBtn.addEventListener("click", ()=>{
    let currPage = parseInt(currentBtn.textContent);
    console.log("current page from button", currPage);
    currPage-=1;
    currentBtn.textContent = currPage;
    cardContainer.innerHTML=""; // Clear old cards
    CheckWebpage(currPage);
});
