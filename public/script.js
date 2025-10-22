// Search Section:-------------------------------------------------------------------------------
const searchBar = document.querySelector(".search-input");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

async function handleSearch() {
    const SearchVal = searchBar.value;
    searchResults.innerHTML = "";   // Clear old results
    const response = await fetch("http://localhost:5050/search", {  // Fetch search result from backend
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
                    <small>${record.Year}</small>
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



// Load Data:---------------------------------------------------------------------------------------
// Load Trending Data:----
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page; // set in EJS <body data-page="trending">

    if (page === "trending") loadTrending(1);
    if (page === "popular") loadPopular();
    if (page === "bookmarks") loadBookmarks();
});
async function loadTrending(page){
    const response = await fetch(`/api/trending?page=${page}`);
    const data = await response.json();
    console.log("Trending data received from backend:", data);
    const results = data.data.tmdbdata.results;
    // console.log("Data results:", data.data.tmdbdata.results);
    populateCards(results);
}


// Populate Cards and Handle Bookmarks:-----------------------------------------------------------
const cardContainer = document.querySelector("#cardContainer");
function populateCards(results) {
    const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

    results.forEach(record => {
        const div = document.createElement("div");
        div.classList.add("col-6", "col-md-3", "col-xl-2", "cardCont");

        const isBookmarked = savedBookmarks.includes(String(record.id));
        const title = record.original_title || record.original_name || "Untitled";
        const date = (record.release_date!="undefined" ? (new Date(record.release_date).getFullYear()) : "N/A") || (record.first_air_date!="undefined" ? (new Date(record.first_air_date).getFullYear()) : "N/A");
        div.innerHTML = `
            <div class="card" style="min-width: 9rem;">
                <a href="#">
                    <img src="${"https://image.tmdb.org/t/p/w500"+record.poster_path}" class="card-img-top" alt="${title}">
                </a>
                <div class="card-body p-1">
                    <h5 class="card-title">${title}</h5>
                    <span class="card-text d-flex justify-content-between">
                        <span>${record.media_type}</span>
                        <span>${date}</span>
                        <button class="btn btn-default p-0 bookmark-btn" data-id="${record.id}">
                            <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
                        </button>
                    </span>
                </div>
            </div>
        `;

        // Handle Bookmark Button Click
        const btn = div.querySelector(".bookmark-btn");
        const icon = btn.querySelector("i");
        btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        const movieId = btn.dataset.id;
        const index = savedBookmarks.indexOf(movieId);

        if (index > -1) {
            savedBookmarks.splice(index, 1);
            icon.classList.replace("fa-solid", "fa-regular");
        } else {
            savedBookmarks.push(movieId);
            icon.classList.replace("fa-regular", "fa-solid");
        }

        localStorage.setItem("bookmarks", JSON.stringify(savedBookmarks));
        });

        cardContainer.appendChild(div);
    });
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
