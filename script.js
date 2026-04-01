/* =========================================================
   GameVerse – script.js
   Author: Khush Gautam
   =========================================================

   Architecture:
   ─────────────
   ① State      – single source of truth
   ② API        – fetch from FreeToGame
   ③ Render     – build DOM from state
   ④ Filters    – search / genre / platform / sort (using HOFs)
   ⑤ Favourites – persist to localStorage
   ⑥ Modal      – game detail overlay
   ⑦ Theme      – dark / light toggle
   ⑧ Events     – wire everything together
*/

'use strict';

/* =========================================================
   ① STATE
   ========================================================= */
const state = {
  allGames:      [],   // raw API response
  filtered:      [],   // result after search / filter / sort
  favourites:    [],   // array of game ids
  showFavsOnly:  false,
  searchQuery:   '',
  genre:         '',
  platform:      '',
  sort:          'default',
  searchDebounce: null,
};

/* =========================================================
   ② API
   ========================================================= */
const API_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.freetogame.com/api/games');

async function fetchGames() {
  showLoading();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.allGames = data;
    loadFavourites();
    populateGenreFilter(data);
    applyFilters();
    showGrid();
  } catch (err) {
    showError(err.message);
  }
}

/* =========================================================
   ③ RENDER
   ========================================================= */
function renderGames(games) {
  const grid = document.getElementById('gamesGrid');
  grid.innerHTML = '';

  if (games.length === 0) {
    showEmpty();
    return;
  }

  hideEmpty();

  // Use map() to build card HTML strings, then join & inject
  const cardsHTML = games.map(game => buildCardHTML(game)).join('');
  grid.innerHTML = cardsHTML;

  // Attach event listeners to each card
  grid.querySelectorAll('.game-card').forEach(card => {
    const id = Number(card.dataset.id);

    // Open modal on card click
    card.addEventListener('click', (e) => {
      // If fav badge was clicked, toggle fav and stop propagation
      if (e.target.closest('.card-fav-badge')) {
        e.stopPropagation();
        toggleFavourite(id);
        return;
      }
      const game = state.allGames.find(g => g.id === id);
      if (game) openModal(game);
    });
  });

  updateResultsCount(games.length);
}

function buildCardHTML(game) {
  const isFav    = state.favourites.includes(game.id);
  const favClass = isFav ? 'is-fav' : '';
  const date     = formatDate(game.release_date);
  const platform = game.platform === 'PC (Windows)' ? '💻 PC' : '🌐 Browser';

  return `
    <article class="game-card ${favClass}" data-id="${game.id}" tabindex="0" role="button" aria-label="View ${escapeHTML(game.title)}">
      <div class="card-thumb-wrap">
        <img
          class="card-thumb"
          src="${escapeHTML(game.thumbnail)}"
          alt="${escapeHTML(game.title)} thumbnail"
          loading="lazy"
          onerror="this.src='https://placehold.co/365x206/1a1a2e/7c5cff?text=No+Image'"
        />
        <button class="card-fav-badge" aria-label="${isFav ? 'Remove from' : 'Add to'} favourites" title="${isFav ? 'Remove from favourites' : 'Add to favourites'}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-chips">
          <span class="chip chip-genre">${escapeHTML(game.genre)}</span>
          <span class="chip chip-platform">${platform}</span>
        </div>
        <h2 class="card-title">${escapeHTML(game.title)}</h2>
        <p class="card-desc">${escapeHTML(game.short_description)}</p>
        <div class="card-footer">
          <span class="card-date">${date}</span>
          <a
            href="${escapeHTML(game.game_url)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary card-play-btn"
            onclick="event.stopPropagation()"
            aria-label="Play ${escapeHTML(game.title)}"
          >▶ Play</a>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   ④ FILTERS — all using Array HOFs (filter, sort, find)
   ========================================================= */
function applyFilters() {
  let result = state.allGames;

  // Favourites-only view
  if (state.showFavsOnly) {
    result = result.filter(g => state.favourites.includes(g.id));
  }

  // Search — using .filter() + .toLowerCase()
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    result = result.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.genre.toLowerCase().includes(q) ||
      g.short_description.toLowerCase().includes(q)
    );
  }

  // Genre filter — using .filter()
  if (state.genre) {
    result = result.filter(g => g.genre === state.genre);
  }

  // Platform filter — using .filter()
  if (state.platform) {
    result = result.filter(g => g.platform === state.platform);
  }

  // Sorting — using .sort()
  switch (state.sort) {
    case 'alpha-asc':
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'alpha-desc':
      result = [...result].sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'date-new':
      result = [...result].sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
      break;
    case 'date-old':
      result = [...result].sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
      break;
    default:
      break;
  }

  state.filtered = result;
  renderGames(result);
  updateFilterChips();
}

/* =========================================================
   ⑤ FAVOURITES
   ========================================================= */
const LS_KEY = 'gameverse_favourites';

function loadFavourites() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    state.favourites = saved ? JSON.parse(saved) : [];
  } catch {
    state.favourites = [];
  }
  updateFavCount();
}

function saveFavourites() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state.favourites));
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  updateFavCount();
}

function toggleFavourite(gameId) {
  const alreadyFav = state.favourites.includes(gameId);

  // Use filter to remove, or spread to add — both HOFs
  if (alreadyFav) {
    state.favourites = state.favourites.filter(id => id !== gameId);
  } else {
    state.favourites = [...state.favourites, gameId];
  }

  saveFavourites();
  applyFilters();

  // Update modal button if open
  const modalFavBtn = document.getElementById('modalFavBtn');
  if (modalFavBtn && Number(modalFavBtn.dataset.gameId) === gameId) {
    updateModalFavBtn(gameId);
  }
}

function updateFavCount() {
  document.getElementById('favCount').textContent = state.favourites.length;
}

/* =========================================================
   ⑥ MODAL
   ========================================================= */
function openModal(game) {
  const modal   = document.getElementById('gameModal');
  const isFav   = state.favourites.includes(game.id);
  const platform = game.platform === 'PC (Windows)' ? '💻 PC' : '🌐 Browser';

  document.getElementById('modalImage').src   = game.thumbnail;
  document.getElementById('modalImage').alt   = game.title;
  document.getElementById('modalTitle').textContent = game.title;
  document.getElementById('modalDesc').textContent  = game.short_description;
  document.getElementById('modalGenre').textContent    = game.genre;
  document.getElementById('modalPlatform').textContent = platform;
  document.getElementById('modalDate').textContent     = formatDate(game.release_date);
  document.getElementById('modalPlayLink').href = game.game_url;

  const favBtn = document.getElementById('modalFavBtn');
  favBtn.dataset.gameId = game.id;
  updateModalFavBtn(game.id);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Focus trap — close on Escape
  modal.focus?.();
}

function closeModal() {
  document.getElementById('gameModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function updateModalFavBtn(gameId) {
  const btn   = document.getElementById('modalFavBtn');
  const isFav = state.favourites.includes(gameId);
  btn.textContent = isFav ? '💔 Remove Favourite' : '❤️ Add to Favourites';
  btn.dataset.gameId = gameId;
}

/* =========================================================
   THEME
   ========================================================= */
function initTheme() {
  const saved = localStorage.getItem('gameverse_theme') || 'dark';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '🌙' : '☀️';
  try { localStorage.setItem('gameverse_theme', theme); } catch {}
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
}

/* =========================================================
   GENRE FILTER POPULATION
   ========================================================= */
function populateGenreFilter(games) {
  // Use map() + Set to extract unique genres, then sort alphabetically
  const genres = [...new Set(games.map(g => g.genre))].sort();
  const select  = document.getElementById('genreFilter');

  genres.forEach(genre => {
    const opt = document.createElement('option');
    opt.value = genre;
    opt.textContent = genre;
    select.appendChild(opt);
  });
}

/* =========================================================
   UI STATE HELPERS
   ========================================================= */
function showLoading() {
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('gamesGrid').classList.add('hidden');
}

function showGrid() {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('gamesGrid').classList.remove('hidden');
}

function showError(msg) {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('gamesGrid').classList.add('hidden');
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('errorMsg').textContent = msg || 'Something went wrong.';
  document.getElementById('errorState').classList.remove('hidden');
}

function showEmpty() {
  document.getElementById('emptyState').classList.remove('hidden');
}

function hideEmpty() {
  document.getElementById('emptyState').classList.add('hidden');
}

function updateResultsCount(n) {
  document.getElementById('resultsCount').textContent =
    state.showFavsOnly
      ? `${n} favourite${n !== 1 ? 's' : ''}`
      : `${n} game${n !== 1 ? 's' : ''} found`;
}

function updateFilterChips() {
  const container = document.getElementById('filterChips');
  container.innerHTML = '';

  if (state.genre) {
    container.appendChild(makeChip('chip-genre', `Genre: ${state.genre}`, () => {
      state.genre = '';
      document.getElementById('genreFilter').value = '';
      applyFilters();
    }));
  }

  if (state.platform) {
    const label = state.platform === 'PC (Windows)' ? 'PC' : 'Browser';
    container.appendChild(makeChip('chip-platform', `Platform: ${label}`, () => {
      state.platform = '';
      document.getElementById('platformFilter').value = '';
      applyFilters();
    }));
  }

  if (state.searchQuery) {
    container.appendChild(makeChip('chip-genre', `Search: "${state.searchQuery}"`, () => {
      state.searchQuery = '';
      document.getElementById('searchInput').value = '';
      applyFilters();
    }));
  }

  if (state.showFavsOnly) {
    container.appendChild(makeChip('chip-fav', '❤️ Favourites Only', () => {
      state.showFavsOnly = false;
      updateFavBtn();
      applyFilters();
    }));
  }
}

function makeChip(cls, text, onClose) {
  const span = document.createElement('span');
  span.className = `chip ${cls}`;
  span.innerHTML = `${escapeHTML(text)} <button style="margin-left:4px;background:none;border:none;cursor:pointer;color:inherit;font-size:0.8rem;line-height:1;padding:0" aria-label="Remove filter">✕</button>`;
  span.querySelector('button').addEventListener('click', onClose);
  return span;
}

function updateFavBtn() {
  const btn = document.getElementById('favBtn');
  if (state.showFavsOnly) {
    btn.style.background = 'linear-gradient(135deg, #ff5cad, #ff8c5c)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'transparent';
  } else {
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
}

/* =========================================================
   UTILITIES
   ========================================================= */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* =========================================================
   ⑧ EVENT WIRING
   ========================================================= */
function initEvents() {
  // --- Theme toggle ---
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // --- Search (debounced 350ms) ---
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(state.searchDebounce);
    state.searchDebounce = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      applyFilters();
    }, 350);
  });

  // --- Genre filter ---
  document.getElementById('genreFilter').addEventListener('change', (e) => {
    state.genre = e.target.value;
    applyFilters();
  });

  // --- Platform filter ---
  document.getElementById('platformFilter').addEventListener('change', (e) => {
    state.platform = e.target.value;
    applyFilters();
  });

  // --- Sort ---
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    applyFilters();
  });

  // --- Favourites toggle button ---
  document.getElementById('favBtn').addEventListener('click', () => {
    state.showFavsOnly = !state.showFavsOnly;
    updateFavBtn();
    applyFilters();
  });

  // --- Modal close ---
  document.getElementById('modalClose').addEventListener('click', closeModal);

  // Click overlay backdrop to close
  document.getElementById('gameModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Keyboard: Escape to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Modal favourite btn
  document.getElementById('modalFavBtn').addEventListener('click', () => {
    const id = Number(document.getElementById('modalFavBtn').dataset.gameId);
    if (id) toggleFavourite(id);
  });

  // Retry button
  document.getElementById('retryBtn').addEventListener('click', fetchGames);
}

/* =========================================================
   INIT
   ========================================================= */
function init() {
  initTheme();
  initEvents();
  fetchGames();
}

document.addEventListener('DOMContentLoaded', init);
