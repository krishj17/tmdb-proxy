const results = {
    "adult": false,
    "backdrop_path": "/nYYJBixUNZAk4lmWdE5NBUfIMuw.jpg",
    "id": 247756,
    "name": "The Monster of Florence",
    "original_name": "Il Mostro",
    "overview": "As a serial killer targets couples and strikes terror in Italy, authorities explore a case from 1968 that may be key to finding The Monster of Florence.",
    "poster_path": "/1RRBxq1hEC7rKIp4yac96F9ObL5.jpg",
    "media_type": "tv",
    "original_language": "it",
    "genre_ids": [
        80,
        9648,
        18
    ]
};

import genreList from "./genres.json" with {type: "json"};

const genreID = results.genre_ids;

const genreNames = genreID.map(id => genreList[id]==null ? "N/A" : genreList[id]);

console.log(genreNames);