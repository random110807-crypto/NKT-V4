# NKT — Nashediyon Ki Toli automated Chess.com sidebar

A static, dark-green and antique-gold Chess.com sidebar built on the supplied NKT design. The original page structure, CSS, images, music player, quotes, world clock and navigation are retained. Live club statistics and the Club House/Competitions data are published by a Node.js collector and GitHub Actions.

## What is automated

- Club profile and member count: Chess.com PubAPI `/club/{slug}`.
- Recent joiners: `/club/{slug}/members`, sorted by the public `joined` timestamp.
- Monthly Rating Race: member Rapid + Blitz + Bullet rating change from that member's saved baseline for the current UTC calendar month.
- Overall Club Leaderboard: a transparent score using monthly rating progress (50%), games played during the month (35%) and game win rate (15%).
- Profile pictures for visible leaderboard members: refreshed from Chess.com public player profiles and cached for seven days.
- Club Insights: rolling snapshots calculate observed games played, average rating movement, member growth and a 30-day activity chart. Insights begin with the first successful collector run.
- Competitions view: displays public club team matches (registered, in progress and finished); the Club House itself no longer contains a long event feed.
- Data freshness, collection success/failure counts and stale-data protection.

## Important public API limitations

Chess.com PubAPI is read-only and public-data-only. Chess.com documents that endpoint data may be cached for up to 12 hours and that parallel requests can trigger HTTP 429 responses. The workflow therefore runs every six hours, but a scheduled run cannot force Chess.com to refresh its own cached response.

The club matches endpoint returns club-level match entries and results. It does **not** provide member-by-member match participation or player points. Consequently:

- Match record is shown at club level.
- Individual match points are not invented or included in the member leaderboard.
- MCA points and Vote Chess standings are not generated because the public endpoint set used here does not expose their scoring tables.
- Game of the Month is not auto-awarded: a reliable public source and objective selection method are not available in this collector.
- Chess.com arena tournaments are not assumed to be present in the club team-matches endpoint.

The overall score therefore uses the three individually measurable public statistics stated above. Match performance is displayed separately as a club record until Chess.com exposes member-level match data through a reliable public endpoint. MCA standings are deliberately manual: add rows to `CONFIG.clubhouse.mcaLeaderboard` in `js/config.js`, for example `{ username: "chesscom_username", points: 120, name: "Optional display name" }`. Only rows with a username and non-negative numeric points are displayed; with no valid rows the entire MCA section is omitted. The Member of the Month spotlight is also manual only: set `CONFIG.clubhouse.memberOfTheMonth` to `{ name, username, avatar?, rating?, ratingType?, achievement? }`; leave it `null` to hide it. It is never selected automatically. The Club House has no Vote Chess card, match/event feed, automatic member award, or technical last-updated footer.

## Historical and monthly rules

- Historical tracking starts at the first successful GitHub Actions run after deployment. The collector does not manufacture earlier baselines or claim to know pre-deployment rating changes. Club Insights uses the same first-run boundary and will become more meaningful as snapshots accumulate.
- On first observation, each member receives a baseline. A member first discovered partway through a month becomes eligible after that first baseline; their displayed change is measured from that first observation.
- Monthly Rating Race resets automatically when the UTC month key changes. The first successful run in the new month establishes new baselines.
- The combined rating change is the sum of comparable Rapid, Blitz and Bullet rating changes. A missing format is excluded rather than treated as zero. The formats used are included in the generated JSON.
- Games played, wins, losses and draws are calculated as deltas in the public lifetime player-stat counters between successful snapshots. These are general Chess.com games, not necessarily games played in NKT team matches.
- The overall leaderboard score is a relative monthly score: rating progress 50%, games played 35%, win rate 15%. Each component is normalized against the current observed roster; score is not a Chess.com rating or official award points.

## Project structure

```text
NKT-Final-Sidebar/
├── index.html
├── css/styles.css                 # Original visual design retained
├── js/                            # Existing sidebar modules + automated renderers
├── assets/images/                 # Original NKT images retained
├── assets/music/                  # Add your own MP3 files here
├── scripts/update-nkt-data.mjs    # Node.js PubAPI collector + analytics
├── data/nkt-state.json            # Persistent baselines (committed by Actions)
├── data/nkt-dashboard.json        # Public JSON consumed by the sidebar
├── .github/workflows/update-nkt-data.yml
└── package.json
```

## Deploy and activate automation

1. Create or use a GitHub repository for this folder and upload the complete project.
2. Ensure the repository's default branch matches the branch configured in `.github/workflows/update-nkt-data.yml` (currently `main`).
3. In GitHub, enable **Settings → Actions → General → Workflow permissions → Read and write permissions**. The workflow needs write access to commit the generated JSON/state files.
4. Open **Actions → Update NKT automated sidebar data → Run workflow** for the first baseline run. The schedule then runs every six hours (`23 */6 * * *` UTC).
5. Enable GitHub Pages for the repository (deploy from the branch/folder containing `index.html`). Keep `data/nkt-dashboard.json` at the same published root-relative path.
6. Open the Pages URL. The browser reads the generated dashboard JSON; it does not need to make hundreds of Chess.com API calls itself.

No API key is required. `CHESSCOM_USER_AGENT` is set in the workflow. If you fork or rename the project, keep the club slug `nashediyon-ki-toli-nkt` unless the Chess.com club URL itself changes.

## Run the collector locally

Requires Node.js 20 or newer and network access:

```bash
npm run update:data
```

The collector uses only Node's built-in `fetch` and filesystem APIs; there are no npm runtime dependencies. Every request has a 10-second timeout and at most two attempts; retry delays are capped, progress is logged during roster processing, and the workflow has a 30-minute ceiling. Member-stat requests are serial with a short pause to reduce rate-limit risk. A failed/incomplete club response or an insufficient number of successful member-stat responses aborts before publishing a replacement dashboard.

## Design preservation

The uploaded `index.html`, `css/styles.css`, image assets, quote module, music module, world clock and overall navigation are retained. The Club House is rebuilt as a compact vertical dashboard with a manual Member of the Month spotlight, profile-picture podium and rankings, optional manual MCA performers, and automated snapshot-based insights. Vote Chess and the event list are removed from the Club House. Quotes and music remain editorial/local content as requested.
