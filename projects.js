const GITHUB_USERNAME = "samira-2002-code";
const projectsGrid = document.querySelector("#projects-grid");
const projectsStatus = document.querySelector("#projects-status");
const featuredProjectOrder = [
  "bde-events-fullStack",
  "Easy_Marcket",
  "DarAnawat_stage",
  "Leave_Management",
  "PharmaFEFO",
];
const hero = document.querySelector(".hero");
const portrait = document.querySelector(".hero-photo");
const projectDetails = {
  DarAnawat_stage: {
    category: "Guesthouse website",
    description:
      "A Laravel guesthouse website for discovering the rooms and following the reservation process, with design inspired by Moroccan hospitality.",
    technologies: ["Laravel", "PHP"],
  },
  Easy_Marcket: {
    category: "Training project",
    description:
      "A marketplace for listing items to sell or exchange, with searchable listings, filters, and detailed item views. Built with a Laravel REST API and React frontend.",
    technologies: ["Laravel", "React", "REST API"],
  },
  Leave_Management: {
    category: "Training project",
    description:
      "TIME DNA is a leave-management application for employee requests and manager/HR review, approval, and tracking.",
    technologies: ["JavaScript", "Leave workflows"],
  },
  "PharmaFEFO": {
    category: "Academic project",
    description:
      "A pharmacy stock-management project using FEFO inventory handling, PHP 8, MySQL, and a custom MVC structure.",
    technologies: ["PHP 8", "MySQL", "MVC"],
  },
  "BDE-Events": {
    category: "Campus ticketing",
    description:
      "A Laravel campus event and ticketing application for ENAA, with event management, student reservations, and generated tickets.",
    technologies: ["Laravel", "Blade"],
  },
  "bde-events-fullStack": {
    category: "Campus platform",
    description:
      "An ENAA campus events platform for discovering events, reserving places, and accessing digital tickets, with a Laravel REST API and React app.",
    technologies: ["Laravel", "React", "REST API"],
  },
  edusync_log: {
    category: "Authentication",
    description:
      "A PHP authentication project with account registration, sign-in, session-protected pages, and logout.",
    technologies: ["PHP", "Sessions"],
  },
  peersync: {
    category: "Peer learning",
    description:
      "An ENAA peer-learning platform where students request help and tutors can take on requests, with skills and request-status tracking.",
    technologies: ["PHP", "MySQL"],
  },
};

function startPortraitReveal() {
  if (!hero || !portrait) {
    return;
  }

  const reveal = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hero.classList.add("portrait-ready"));
    });
  };

  if (!portrait.complete) {
    portrait.addEventListener("load", reveal, { once: true });
    portrait.addEventListener(
      "error",
      () => console.warn("The portfolio portrait could not be loaded."),
      { once: true }
    );
    return;
  }

  if (portrait.naturalWidth === 0) {
    console.warn("The portfolio portrait could not be loaded.");
    return;
  }

  if (typeof portrait.decode === "function") {
    portrait.decode().then(reveal).catch(reveal);
  } else {
    reveal();
  }
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createTag(tags, text) {
  tags.append(createTextElement("span", "", text));
}

function createRepositoryCard(repository, index) {
  const details = Object.prototype.hasOwnProperty.call(projectDetails, repository.name)
    ? projectDetails[repository.name]
    : null;
  const repositoryUrl = new URL(repository.html_url);
  if (
    repositoryUrl.protocol !== "https:" ||
    repositoryUrl.hostname !== "github.com" ||
    repositoryUrl.pathname.split("/")[1] !== GITHUB_USERNAME
  ) {
    return null;
  }

  const card = document.createElement("a");
  card.className = "project-card";
  if (index === 0) {
    card.classList.add("project-card-featured");
  }
  card.href = repositoryUrl.href;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.setAttribute(
    "aria-label",
    `${repository.name} repository on GitHub, opens in a new tab`
  );

  const topLine = document.createElement("div");
  topLine.className = "project-topline";
  topLine.append(
    createTextElement(
      "span",
      "project-index",
      `REPOSITORY / ${String(index + 1).padStart(2, "0")}`
    ),
    createTextElement(
      "span",
      "project-kind",
      details?.category || repository.language || "Public project"
    )
  );

  const title = createTextElement("h3", "", repository.name);
  const description = createTextElement(
    "p",
    "",
    repository.description ||
      details?.description ||
      "No description yet. Visit the repository to explore the project."
  );

  const bottom = document.createElement("div");
  bottom.className = "project-bottom";
  const tags = document.createElement("div");
  tags.className = "project-tags";
  if (details) {
    for (const technology of details.technologies) {
      createTag(tags, technology);
    }
  } else if (repository.language) {
    createTag(tags, repository.language);
  }
  const topics = Array.isArray(repository.topics) ? repository.topics : [];
  for (const topic of (details ? [] : topics).slice(0, 2)) {
    createTag(tags, topic);
  }

  bottom.append(tags, createTextElement("span", "project-arrow", "↗"));
  card.append(topLine, title, description, bottom);
  return card;
}

async function loadRepositories() {
  try {
    const repositories = [];
    for (let page = 1; ; page += 1) {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100&type=owner&page=${page}`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!response.ok) {
        throw new Error(`GitHub returned HTTP ${response.status}`);
      }

      const pageRepositories = await response.json();
      if (!Array.isArray(pageRepositories)) {
        throw new TypeError("GitHub returned an unexpected repository list.");
      }
      repositories.push(...pageRepositories);
      if (pageRepositories.length < 100) {
        break;
      }
    }

    const featuredOrder = new Map(
      featuredProjectOrder.map((name, index) => [name, index])
    );
    const ownedProjects = repositories.filter(
      (repository) =>
        repository.owner?.login === GITHUB_USERNAME &&
        !repository.fork &&
        typeof repository.name === "string" &&
        typeof repository.html_url === "string"
    ).sort(
      (first, second) =>
        (featuredOrder.get(first.name) ?? featuredProjectOrder.length) -
        (featuredOrder.get(second.name) ?? featuredProjectOrder.length)
    );
    const cards = ownedProjects
      .map(createRepositoryCard)
      .filter((card) => card !== null);

    if (cards.length === 0) {
      projectsStatus.textContent =
        "No public repositories were found. Browse GitHub to see the profile.";
      return;
    }

    projectsGrid.replaceChildren(...cards);
    projectsStatus.textContent =
      `${cards.length} public projects — selected work first, then recent projects.`;
  } catch (error) {
    console.error("Unable to load public GitHub repositories.", error);
    projectsStatus.textContent =
      "Live projects could not be loaded just now. Featured projects are still available below.";
  }
}

startPortraitReveal();
loadRepositories();
