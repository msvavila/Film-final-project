//API KEY-http://www.omdbapi.com/?i=tt3896198&apikey=28493f65

const API_KEY = "28493f65";
const FEATURE_TERMS = ["avengers", "iron man", "thor", "black panther", "spider-man" ,"guardians of the galaxy", "doctor strange", "ant man"];

const FALLBACK_POSTER = "./assets-film/no-poster.png";

const $ = (selector) => document.querySelector(selector);
const el = {
    input: document.querySelector("#search-input"),
    button: document.querySelector("#search-button"),
    label: document.querySelector("#results-label"),
    sortby: document.querySelector("#sort-select"),
    container: document.querySelector("#movies-container"),
};

let movies = [];
let defaultMovies = [];


async function searchMovies(term) {
  const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(term)}&type=movie`;
  const res = await fetch(url);
  const data = await res.json();
  return data.Response === "False" ? [] : (data.Search ?? []);
}

function bestPickFromSearch(term, list) {
  if (!list.length) return null;
  const t = term.toLowerCase();

  const exact = list.find(m => (m.Title || "").toLowerCase() === t);
  if (exact) return exact;

  const contains = list.find(m => (m.Title || "").toLowerCase().includes(t));
  return contains || list[0];
}

function renderMovies(list) {
  el.container.innerHTML = list.map(({ Title, Year, Poster }) => `
    <article class="movie">
      <img class="movie-poster"
        src="${Poster && Poster !== "N/A" ? Poster : FALLBACK_POSTER}"
        alt="${Title}"
        onerror="this.onerror=null; this.src='${FALLBACK_POSTER}';">
      <h3 class="movie__title">${Title}</h3>
      <p class="movie__year">${Year ?? ""}</p>
    </article>
  `).join("");
}

function setView(list) {
  movies = list;
  defaultMovies = [...list];         
  if (el.sortby) el.sortby.value = "default";
  renderMovies(movies);
}

function dedupeByImdbID(list) {
  return [...new Map(list.map(m => [m.imdbID, m])).values()];
}

async function loadFeaturedMarvel(limit = 8) {
  const picks = [];
  const seen = new Set();

  for (const term of FEATURE_TERMS) {
    const results = await searchMovies(term);
    const pick = bestPickFromSearch(term, results);

    if (pick && !seen.has(pick.imdbID)) {
      seen.add(pick.imdbID);
      picks.push(pick);
    }

    if (picks.length === limit) break;
  }

  setView(picks);
}

async function handleSearch() {
  const term = el.input.value.trim();
  if (!term) {
    loadFeaturedMarvel(8);
    return;
  }

  const results = await searchMovies(term);
  setView(dedupeByImdbID(results));
}

function sortAndRender(mode) {
  if (mode === "default") {
    renderMovies(defaultMovies);
    movies = [...defaultMovies];
    return;
  }

  const sorted = [...movies];

  if (mode === "az") sorted.sort((a, b) => a.Title.localeCompare(b.Title));
  if (mode === "za") sorted.sort((a, b) => b.Title.localeCompare(a.Title));
  if (mode === "year-new") sorted.sort((a, b) => (+b.Year || 0) - (+a.Year || 0));
  if (mode === "year-old") sorted.sort((a, b) => (+a.Year || 0) - (+b.Year || 0));

  renderMovies(sorted);
}

document.addEventListener("DOMContentLoaded", () => {
  loadFeaturedMarvel(8);

  el.button.addEventListener("click", handleSearch);

  el.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  el.sortby.addEventListener("change", (e) => {
    sortAndRender(e.target.value);
  });
});