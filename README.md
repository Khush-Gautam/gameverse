# 🎮 GameVerse - Free Online Game Explorer

## 📌 Project Overview

GameVerse is a web-based application that allows users to explore, search, and discover free-to-play online games. The application fetches real-time data from the FreeToGame API and presents it in a clean, responsive, and visually rich interface.

The goal of this project is to demonstrate the use of JavaScript, API integration, and dynamic UI rendering while providing an engaging platform for users to browse and access games easily.

---

## 🎯 Purpose of the Project

This project is developed as part of a web development assignment to showcase:

- API integration using JavaScript (`fetch`)
- Use of array higher-order functions like `map`, `filter`, and `sort`
- Dynamic rendering of UI components
- Responsive and interactive design across all screen sizes

---

## 🚀 Key Features

- 🎮 **Browse Games:** View a collection of free-to-play games with thumbnails and details
- 🔍 **Search Functionality:** Debounced search by title, genre, or description (uses `.filter()`)
- 🎯 **Genre Filtering:** Filter games by genre (uses `.filter()`)
- 💻 **Platform Filtering:** Filter by PC or Browser (uses `.filter()`)
- 🔼 **Sorting:** Sort A→Z, Z→A, Newest First, or Oldest First (uses `.sort()`)
- ▶️ **Play Games:** Redirect to the official game page directly from cards or modal
- ❤️ **Favourites:** Save favourite games using `localStorage` — persists across sessions
- 🌙 **Dark / Light Mode:** Toggle themes — preference saved in `localStorage`
- ⏳ **Loading State:** Animated spinner while fetching data
- ⚠️ **Error Handling:** Friendly error state with retry button
- 🔇 **Empty State:** Shown when no games match the current filters
- 🏷️ **Active Filter Chips:** Visual chips showing active filters with one-click removal
- 🗂️ **Game Detail Modal:** Click any card for a full-screen game detail overlay

---

## 🌐 API Used

This project uses the **FreeToGame API**:
```
https://www.freetogame.com/api/games
```

> Accessed via [allorigins.win](https://allorigins.win) CORS proxy for browser compatibility.

### Why this API?

- Provides structured and relevant game data (title, genre, platform, thumbnail, description, URL)
- No authentication required
- Contains 300+ free-to-play games covering diverse genres

---

## 🛠️ Technologies Used

| Tech | Purpose |
|---|---|
| HTML5 | Semantic structure |
| CSS3 | Styling, responsive design, animations |
| JavaScript (ES6+) | Logic, interactivity |
| Fetch API | Data fetching from FreeToGame |
| localStorage | Persist favourites and theme preference |

> No external libraries or frameworks — pure Vanilla JS, HTML, CSS.

---

## 📂 Project Structure

```
gameverse/
│
├── index.html    ← App structure, modal, controls
├── style.css     ← Dark/light themes, responsive grid, animations
├── script.js     ← API fetch, HOF logic, events, state management
└── README.md
```

---

## ⚙️ How to Run the Project

1. Clone the repository:
   ```bash
   git clone https://github.com/Khush-Gautam/gameverse.git
   ```
2. Open the project folder
3. Open `index.html` in any modern browser

> No build step, no dependencies, no installation needed.

---

## 🧠 Higher-Order Functions Used

| Feature | HOF Used | Where |
|---|---|---|
| Search by title/genre/desc | `.filter()` | `applyFilters()` |
| Genre filtering | `.filter()` | `applyFilters()` |
| Platform filtering | `.filter()` | `applyFilters()` |
| Favourites only view | `.filter()` | `applyFilters()` |
| Sort A→Z / Z→A | `.sort()` | `applyFilters()` |
| Sort by release date | `.sort()` | `applyFilters()` |
| Build card HTML from data | `.map()` | `renderGames()` |
| Unique genres list | `.map()` + `Set` | `populateGenreFilter()` |
| Remove from favourites | `.filter()` | `toggleFavourite()` |
| Add to favourites | spread `[...arr]` | `toggleFavourite()` |

---

## ⭐ Bonus Features Implemented

- **Debounced search** (350ms) — avoids filtering on every keystroke
- **localStorage** — persistent favourites and theme across sessions
- **Loading indicators** — animated spinner during API fetch
- **Error handling** — user-friendly error state with retry

---

## 📅 Project Milestones

| Milestone | Task | Status | Deadline |
|---|---|---|---|
| 1 | Project planning and setup | ✅ Done | 23rd March |
| 2 | API integration and responsive UI display | ✅ Done | 1st April |
| 3 | Search, filter, sort, favourites, dark mode | ✅ Done | 8th April |
| 4 | Deployment and final documentation | ⏳ Pending | 10th April |

---

## 💡 Future Enhancements

- Pagination for large datasets
- Infinite scroll
- PWA support (service worker + manifest)
- Throttled scroll events

---

## 👨‍💻 Author

**Khush Gautam**
