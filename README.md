# Youtube Bookmarks

Setup: 
```bash
npm install
npm run prisma
mkdir -p assets/{capture,data,icons,images} # setup directories
npm run tsnd                                # backend dev server
npm run dev                                 # frontend dev server
```

Dotenv (.env) contents:
```
SERVER_PORT=3005
VITE_SERVER_PORT=3005
VITE_PORT=9005
YOUTUBE_API_KEY='your-super-secret-api-key-;)'
STORAGE_DIRECTORY='assets'
```

Cleanup: 
```bash
rm -rf node_modules prisma/{migrations,dev.db}
```
