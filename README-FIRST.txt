====================================================================
 SEA ROBIN CLASSIC  -  READ THIS FIRST (Windows 11 setup)
====================================================================

STEP 1 - PUT THIS FOLDER IN THE RIGHT PLACE

  Move/unzip this whole folder to a SHORT path with NO SPACES,
  OUTSIDE of OneDrive. The recommended spot:

        C:\dev\sea-robin-classic

  Create C:\dev if it doesn't exist, then put the folder inside it.

  DO NOT put it in Documents, Desktop, or Downloads - on Windows 11
  those are usually OneDrive-synced, and OneDrive breaks the dev
  server and node_modules (file-lock and re-sync errors). Also avoid
  spaces in the path (e.g. "My Projects") and Program Files.

STEP 2 - RUN THE SETUP

  Open the folder and DOUBLE-CLICK:  setup-windows.bat

  - Click YES on the Windows admin prompt.
  - Press a key at the intro screen to start.
  - Allow any extra install prompts.
  It installs Node.js, Git, the Gemini CLI (free AI coding agent),
  the Netlify CLI, the Supabase CLI, PowerShell 7, and the project's
  dependencies. Safe to run more than once.

STEP 3 - START WORKING

  In this folder (use Windows Terminal):
     gemini        -> sign in with a PERSONAL Google account (free tier)
     npm run dev   -> run the app locally
                      demo login: moc@searobinclassic.com / searobin

STEP 4 - GO LIVE (when ready)

  Ask Mike for the real Supabase + Netlify credentials. Put the
  Supabase values in .env.local, then deploy with:
     netlify deploy --build --prod

MORE DETAIL
  SRCSFT_APP.md  - full app overview + developer handoff
  GEMINI.md      - loads automatically as the AI agent's context
====================================================================
