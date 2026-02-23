const GITHUB_USER = "LadonON";
const API_ROOT = "https://api.github.com";

const repoCountEl = document.getElementById("repoCount");
const followerCountEl = document.getElementById("followerCount");
const followingCountEl = document.getElementById("followingCount");
const projectGridEl = document.getElementById("projectGrid");
const projectTemplate = document.getElementById("projectTemplate");
const aboutProjectListEl = document.getElementById("aboutProjectList");
const yearEl = document.getElementById("year");

yearEl.textContent = new Date().getFullYear();

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`);
  }
  return response.json();
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function createProjectCard(repo, index) {
  const fragment = projectTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".project-card");
  card.style.animationDelay = `${index * 80}ms`;

  const title = fragment.querySelector("h3");
  const description = fragment.querySelector(".description");
  const language = fragment.querySelector(".language");
  const stars = fragment.querySelector(".stars");
  const link = fragment.querySelector("a");

  title.textContent = repo.name;
  description.textContent = repo.description || "No description provided.";
  language.textContent = repo.language || "n/a";
  stars.textContent = `* ${repo.stargazers_count}`;
  link.href = repo.html_url;

  return fragment;
}

function renderFeaturedFallback(message) {
  projectGridEl.innerHTML = `<article class="project-card"><p>${message}</p></article>`;
}

function renderAboutProjects(repos) {
  if (!aboutProjectListEl) {
    return;
  }

  if (!repos.length) {
    aboutProjectListEl.innerHTML = "<li>No public repositories found yet.</li>";
    return;
  }

  const topRepos = repos.slice(0, 3);
  const items = topRepos.map((repo) => {
    const description = repo.description || "No description provided.";
    return `<li><strong><a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a></strong>: ${description}</li>`;
  });

  aboutProjectListEl.innerHTML = items.join("");
}

async function loadGitHubData() {
  try {
    const [profile, repos] = await Promise.all([
      fetchJson(`${API_ROOT}/users/${GITHUB_USER}`),
      fetchJson(`${API_ROOT}/users/${GITHUB_USER}/repos?type=owner&per_page=100`)
    ]);

    repoCountEl.textContent = formatNumber(profile.public_repos);
    followerCountEl.textContent = formatNumber(profile.followers);
    followingCountEl.textContent = formatNumber(profile.following);

    const rankedRepos = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count || Date.parse(b.updated_at) - Date.parse(a.updated_at));

    renderAboutProjects(rankedRepos);

    const featuredRepos = rankedRepos.slice(0, 6);

    if (!featuredRepos.length) {
      renderFeaturedFallback("No public repositories found yet.");
      return;
    }

    const cards = document.createDocumentFragment();
    featuredRepos.forEach((repo, index) => {
      cards.appendChild(createProjectCard(repo, index));
    });

    projectGridEl.innerHTML = "";
    projectGridEl.appendChild(cards);
  } catch (error) {
    renderFeaturedFallback("Unable to load repositories right now. Please refresh later.");
    if (aboutProjectListEl) {
      aboutProjectListEl.innerHTML = "<li>Unable to load suggested projects right now.</li>";
    }
    console.error(error);
  }
}

loadGitHubData();
