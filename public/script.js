// Search Section:-------------------------------------------------------------------------------
const searchBar = document.querySelector(".search-input");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

async function handleSearch() {
    let SearchVal = searchBar.value;
    SearchVal = SearchVal.trim();
    searchResults.innerHTML = "";   // Clear old results
    const response = await fetch("/search", {  // Fetch search result from backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({Search : SearchVal}),
    })
    const data = await response.json();     console.log("From Server",data);
    
    if(data.omdb.Response=="True"){
        for(record of data.omdb.Search){  // Repopulate the search results 
            console.log(record)
            const div = document.createElement("div");
            div.classList.add("search-result-item");
            div.innerHTML = `
                <a class="search-result-item" href="/player?mediaType=${record.Type}&id=${record.imdbID}">
                    <img src="${record.Poster}" alt="${record.Title}">
                    <div class="info">
                        <h6>${record.Title}</h6>
                        <small>${record.Year} - ${record.Type}</small>
                    </div>
                </a>
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
    
    // If we're on the player page, fetch content
    if (page === "player") loadPlayer();
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
            poster: record.poster_path 
                ? `https://image.tmdb.org/t/p/w500${record.poster_path}`
                : '/assets/not-available-img.jpg',
            year: date,
            mediaType: record.media_type,
        };
        const isBookmarked = savedBookmarks.some(b => b.tmdbId === data.tmdbId);
        const ContentId = `${data.mediaType}:${data.tmdbId}`;  // not required
        
        div.innerHTML = `
            <div class="card" style="min-width: 9rem;">
                <a href="/player?mediaType=${data.mediaType}&id=${data.tmdbId}">
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
    const exists = savedBookmarks.some(b => b.tmdbId === data.tmdbId);  // check individual bookmark ids with the card's data id set earlier.
    try {
        if (exists) {
            // --- REMOVE BOOKMARK ---
            if (isLoggedIn) {   // For Login User
                const response = await fetch(`/api/bookmarks/delete/${data.tmdbId}`, { method: "DELETE" });
                if (response.ok) {
                    savedBookmarks = savedBookmarks.filter(b => b.tmdbId !== data.tmdbId);
                    icon.classList.replace("fa-solid", "fa-regular");
                } else {
                    console.warn("Server failed to remove bookmark");
                }
            } else {    // For localStorage user (not logged in)
                savedBookmarks = savedBookmarks.filter(b => b.tmdbId !== data.tmdbId);
                icon.classList.replace("fa-solid", "fa-regular");
            };
        } else {
            // --- ADD BOOKMARK ---
            if(isLoggedIn){    // For Login User
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
            } else {    // For localStorage user (not logged in)
                savedBookmarks.push(data);
                icon.classList.replace("fa-regular", "fa-solid");
            };
        };
        // Always sync localStorage after operation
        localStorage.setItem("bookmarks", JSON.stringify(savedBookmarks));
    } catch (err) {
        console.error("Bookmark error:", err);
    }; 
};



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
if (nextBtn && currentBtn && cardContainer) {
    nextBtn.addEventListener("click", ()=>{
        let currPage = parseInt(currentBtn.textContent);
        console.log("current page from button", currPage);
        currPage+=1;
        currentBtn.textContent = currPage;
        cardContainer.innerHTML=""; // Clear old cards
        CheckWebpage(currPage);
    });
};
if (nextBtn && currentBtn && cardContainer) {
    prevBtn.addEventListener("click", ()=>{
        let currPage = parseInt(currentBtn.textContent);
        console.log("current page from button", currPage);
        currPage-=1;
        currentBtn.textContent = currPage;
        cardContainer.innerHTML=""; // Clear old cards
        CheckWebpage(currPage);
    });
};




// Load Player Data:-------------------------------------------------------------------------------------------------------

// Load Player Data with improved layout
async function loadPlayer(){
    const urlParams = new URLSearchParams(window.location.search);
    let mediaTypeParam = urlParams.get('mediaType');
    const id = urlParams.get('id');
    
    if (!mediaTypeParam || !id) {
        console.error('Missing mediaType or id parameters');
        return;
    }
    mediaTypeParam = mediaTypeParam=== 'movie' ? 'movie' : 'tv'; // sanitize input change to "tv" if its "series"

    const serverDataElement = document.getElementById('server-data');
    if (!serverDataElement) {
        console.error('Server data element not found');
        return;
    }
    const serverData = JSON.parse(serverDataElement.textContent);
    const data = serverData.tmdb.tmdbdata;   console.log(serverData)

    const mediaType = data.media_type || mediaTypeParam;

    const playerMain = document.getElementById('player-main');
    playerMain.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('https://image.tmdb.org/t/p/original${data.backdrop_path}')`;

    function groupCrewByPerson(crew) {
        const grouped = {};
        const importantJobs = ['Director', 'Writer', 'Producer', 'Screenplay', 'Story', 'Executive Producer', 'Director of Photography', 'Editor', 'Original Music Composer'];
        
        crew.filter(person => importantJobs.includes(person.job)).forEach(person => {
            if (!grouped[person.id]) {
                grouped[person.id] = {
                    id: person.id,
                    name: person.name,
                    profile_path: person.profile_path,
                    jobs: []
                };
            }
            if (!grouped[person.id].jobs.includes(person.job)) {
                grouped[person.id].jobs.push(person.job);
            }
        });
        return Object.values(grouped);
    }

    if (mediaType === 'movie') {
        const groupedCrew = groupCrewByPerson(data.credits?.crew || []);
        playerMain.innerHTML = `
            <div class="container">
                <!-- Top Section: Poster + Info -->
                <div class="row mb-4">
                    <div class="col-12 col-md-3 text-center mb-3">
                        <img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="${data.title}" class="player-img w-100" />
                    </div>
                    <div class="col-12 col-md-9">
                        <h2 class="mb-2">${data.title}</h2>
                        ${data.tagline ? `<h6 class="fst-italic text-warning mb-3">${data.tagline}</h6>` : ''}
                        <p class="mb-3">${data.overview}</p>
                        <div class="meta-info mb-3">
                            <span class="me-3"><i class="fa-solid fa-calendar me-1"></i> ${data.release_date}</span>
                            <span class="me-3"><i class="fa-solid fa-clock me-1"></i> ${data.runtime} min</span>
                            <span class="me-3"><i class="fa-solid fa-star text-warning me-1"></i> ${data.vote_average?.toFixed(1)}</span>
                            <span class="me-3"><i class="fa-solid fa-language me-1"></i> ${data.original_language?.toUpperCase() ?? 'N/A'}</span>
                        </div>
                        <div class="genres-container mb-3">
                            ${data.genres?.map(g => `<span class="genre-badge">${g.name}</span>`).join('') || ''}
                        </div>
                    </div>
                </div>

                <!-- Cast Section -->
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-users me-2"></i>Cast
                    </h4>
                    <div class="horizontal-scroll-container">
                        ${data.credits?.cast?.slice(0, 15).map(person => `
                            <div class="person-card">
                                <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : '/not-available-img.jpg'}" 
                                    alt="${person.name}" class="person-img"
                                />
                                <div class="person-info">
                                    <div class="person-name">${person.name}</div>
                                    <div class="person-role">${person.character || 'Unknown Role'}</div>
                                </div>
                            </div>
                        `).join('') || '<p class="text-muted">No cast information available</p>'}
                    </div>
                </div>

                <!-- Crew Section -->
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-film me-2"></i>Crew
                    </h4>
                    <div class="horizontal-scroll-container">
                        ${groupedCrew.slice(0, 15).map(person => `
                            <div class="person-card">
                                <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : '/not-available-img.jpg'}" 
                                     alt="${person.name}" class="person-img" />
                                <div class="person-info">
                                    <div class="person-name">${person.name}</div>
                                    <div class="person-role">${person.jobs.join(' · ')}</div>
                                </div>
                            </div>
                        `).join('') || '<p class="text-muted">No crew information available</p>'}
                    </div>
                </div>

                <!-- Production Companies -->
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-building me-2"></i>Production Companies
                    </h4>
                    <div class="horizontal-scroll-container">
                        ${data.production_companies?.map(company => `
                            <div class="company-card">
                                <img src="${company.logo_path ? `https://image.tmdb.org/t/p/w185${company.logo_path}` : '/not-available-img.jpg'}" 
                                     alt="${company.name}" class="company-img" />
                                <div class="company-name">${company.name}</div>
                            </div>
                        `).join('') || '<p class="text-muted">No production information available</p>'}
                    </div>
                </div>

                <!-- Streaming Platforms -->
                ${data.streaming ? `
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-tv me-2"></i>Where to Watch
                    </h4>
                    <p>${data.streaming}</p>
                </div>
                ` : ''}
            </div>
        `;
    } else if (mediaType === 'tv') {
        playerMain.innerHTML = `
            <div class="container">
                <!-- Top Section: Poster + Info -->
                <div class="row mb-4">
                    <div class="col-12 col-md-3 text-center mb-3">
                        <img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="${data.name}" class="player-img w-100" />
                    </div>
                    <div class="col-12 col-md-9">
                        <h2 class="mb-2">${data.name}</h2>
                        ${data.tagline ? `<h6 class="fst-italic text-warning mb-3">${data.tagline}</h6>` : ''}
                        <p class="mb-3">${data.overview}</p>
                        <div class="meta-info mb-3">
                            <span class="me-3"><i class="fa-solid fa-calendar me-1"></i> ${data.first_air_date}</span>
                            <span class="me-3"><i class="fa-solid fa-circle-info me-1"></i> ${data.status}</span>
                            <span class="me-3"><i class="fa-solid fa-star text-warning me-1"></i> ${data.vote_average?.toFixed(1)}</span>
                            <span class="me-3"><i class="fa-solid fa-tv me-1"></i> ${data.number_of_seasons} Seasons</span>
                            <span class="me-3"><i class="fa-solid fa-list me-1"></i> ${data.number_of_episodes} Episodes</span>
                        </div>
                        <div class="genres-container mb-3">
                            ${data.genres?.map(g => `<span class="genre-badge">${g.name}</span>`).join('') || ''}
                        </div>
                    </div>
                </div>

                <!-- Cast Section -->
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-users me-2"></i>Cast
                    </h4>
                    <div class="horizontal-scroll-container">
                        ${data.credits?.cast?.slice(0, 15).map(person => `
                            <div class="person-card">
                                <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : '/not-available-img.jpg'}" 
                                     alt="${person.name}" class="person-img" />
                                <div class="person-info">
                                    <div class="person-name">${person.name}</div>
                                    <div class="person-role">${person.character || 'Unknown Role'}</div>
                                </div>
                            </div>
                        `).join('') || '<p class="text-muted">No cast information available</p>'}
                    </div>
                </div>

                <!-- Creators Section -->
                ${data.created_by && data.created_by.length > 0 ? `
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-lightbulb me-2"></i>Created By
                    </h4>
                    <div class="horizontal-scroll-container">
                        ${data.created_by.map(creator => `
                            <div class="person-card">
                                <img src="${creator.profile_path ? `https://image.tmdb.org/t/p/w185${creator.profile_path}` : '/not-available-img.jpg'}" 
                                     alt="${creator.name}" class="person-img" />
                                <div class="person-info">
                                    <div class="person-name">${creator.name}</div>
                                    <div class="person-role">Creator</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Production Companies -->
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-building me-2"></i>Production Companies
                    </h4>
                    <div class="horizontal-scroll-container">
                        ${data.production_companies?.map(company => `
                            <div class="company-card">
                                <img src="${company.logo_path ? `https://image.tmdb.org/t/p/w185${company.logo_path}` : '/not-available-img.jpg'}" 
                                     alt="${company.name}" class="company-img" />
                                <div class="company-name">${company.name}</div>
                            </div>
                        `).join('') || '<p class="text-muted">No production information available</p>'}
                    </div>
                </div>

                <!-- Streaming Platforms -->
                ${data.streaming ? `
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-tv me-2"></i>Where to Watch
                    </h4>
                    <p>${data.streaming}</p>
                </div>
                ` : ''}

                <!-- Seasons -->
                ${data.seasons && data.seasons.length > 0 ? `
                <div class="section-container mb-4">
                    <h4 class="section-title mb-3">
                        <i class="fa-solid fa-list me-2"></i>Seasons
                    </h4>
                    <div class="seasons-grid">
                        ${data.seasons.map(season => `
                            <div class="season-card">
                                <img src="${season.poster_path ? `https://image.tmdb.org/t/p/w185${season.poster_path}` : '/not-available-img.jpg'}" 
                                     alt="${season.name}" class="season-img" />
                                <div class="season-info">
                                    <div class="season-name">${season.name}</div>
                                    <div class="season-details">${season.episode_count} Episodes</div>
                                    <div class="season-details">${season.air_date || 'TBA'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
}
