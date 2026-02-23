const GITHUB_USER = "LadonON";
const API_ROOT = "https://api.github.com";

const sortByEl = document.getElementById("sortBy");
const languageFilterEl = document.getElementById("languageFilter");
const resultsTitleEl = document.getElementById("resultsTitle");
const allProjectGridEl = document.getElementById("allProjectGrid");
const projectTemplateEl = document.getElementById("projectTemplateAll");
const yearEl = document.getElementById("year");

yearEl.textContent = new Date().getFullYear();

let allRepos = [];

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`);
  }

  return response.json();
}

function formatDate(isoDate) {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) {
    return "updated unknown";
  }

  return `updated ${new Date(parsed).toLocaleDateString()}`;
}

function populateLanguageFilter(repos) {
  const languages = [...new Set(repos.map((repo) => repo.language).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  languages.forEach((language) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = language;
    languageFilterEl.appendChild(option);
  });
}

function sortRepos(repos, sortBy) {
  if (sortBy === "updated") {
    return [...repos].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  }

  if (sortBy === "name") {
    return [...repos].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count || Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

function renderProjects() {
  const selectedLanguage = languageFilterEl.value;
  const sorted = sortRepos(allRepos, sortByEl.value);
  const filtered = selectedLanguage === "all" ? sorted : sorted.filter((repo) => repo.language === selectedLanguage);

  if (!filtered.length) {
    resultsTitleEl.textContent = "No matching repositories";
    allProjectGridEl.innerHTML = '<article class="project-card"><p>No repositories matched this filter.</p></article>';
    return;
  }

  resultsTitleEl.textContent = `${filtered.length} Project${filtered.length === 1 ? "" : "s"}`;

  const fragment = document.createDocumentFragment();

  filtered.forEach((repo, index) => {
    const card = projectTemplateEl.content.cloneNode(true);
    const projectCard = card.querySelector(".project-card");
    const title = card.querySelector("h3");
    const description = card.querySelector(".description");
    const language = card.querySelector(".language");
    const stars = card.querySelector(".stars");
    const updated = card.querySelector(".updated");
    const link = card.querySelector("a");

    projectCard.style.animationDelay = `${index * 40}ms`;
    title.textContent = repo.name;
    description.textContent = repo.description || "No description provided.";
    language.textContent = repo.language || "n/a";
    stars.textContent = `* ${repo.stargazers_count}`;
    updated.textContent = formatDate(repo.updated_at);
    link.href = repo.html_url;

    fragment.appendChild(card);
  });

  allProjectGridEl.innerHTML = "";
  allProjectGridEl.appendChild(fragment);
}

async function loadRepositories() {
  try {
    const repos = await fetchJson(`${API_ROOT}/users/${GITHUB_USER}/repos?type=owner&per_page=100`);

    allRepos = repos.filter((repo) => !repo.fork);
    populateLanguageFilter(allRepos);
    renderProjects();
  } catch (error) {
    resultsTitleEl.textContent = "Unable to load repositories";
    allProjectGridEl.innerHTML = '<article class="project-card"><p>Could not load repositories right now. Please try again later.</p></article>';
    console.error(error);
  }
}

sortByEl.addEventListener("change", renderProjects);
languageFilterEl.addEventListener("change", renderProjects);

loadRepositories();
