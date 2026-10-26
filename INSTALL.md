# Rebuild: installing on your iPhone

**What this is**

Rebuild is a small web app that builds a gym session to fit the time you have, picks exercises according to which muscle groups have recovered, prescribes weights from your own log, and charts your progress. It runs entirely on your iPhone once installed. Your training data never leaves the phone unless you export it.

**What is in the folder**

`index.html`, `app.js` and `engine.js` are the app itself. `sw.js` and `manifest.webmanifest` let it install to the home screen and work without signal. The `icons` and `fonts` folders hold the app icon and the number typeface. This file is only instructions and is not needed by the app.

**Step 1: put it on GitHub Pages (about ten minutes, easiest on your PC)**

Create a free account at github.com if you do not already have one. Click the plus sign at the top right, choose New repository, name it `rebuild`, leave it Public and click Create repository. On a free account GitHub Pages only publishes public repositories; that means the app's code is visible to anyone, but none of your training data is ever stored there.

On the new repository's page, click "uploading an existing file", then drag in everything inside the unzipped `rebuild` folder: all the files plus the `icons` and `fonts` folders. Click Commit changes.

Then open Settings, choose Pages in the left-hand list, and under Build and deployment set Source to "Deploy from a branch", choose the `main` branch and the `/ (root)` folder, and click Save. GitHub says publishing can take up to ten minutes. The app will then be at `https://YOUR-USERNAME.github.io/rebuild/`.

**Step 2: add it to the iPhone home screen (iOS 26)**

Open that address in Safari. Tap the three-dot button next to the address bar, then Share, then Add to Home Screen. Leave Open as Web App switched on and tap Add.

Always open Rebuild from the home-screen icon. Apple keeps a home-screen web app's storage separate from Safari's, so anything you log in a Safari tab will not appear in the installed app.

**Step 3: first use**

Open Setup and check the equipment list. Every Watson plate-loaded machine is ticked by default; untick the ones your gym does not have. Free weights and cable machines are ticked too; the Hammer Strength group is off unless you tick it. If a machine turns out to be missing mid-session, the swap button on that exercise has a "My gym doesn't have this" option that unticks it for good.

The first time you do each exercise is a calibration: start light, add weight each set, and stop at a weight you could lift for the stated reps with two or three in reserve. Rate the last set. From the next session the app sets the working weight itself.

**Using it**

The Home tab is a dashboard: sessions this week against your weekly goal, sets, volume compared with the same point last week, your streak, your last session and latest best, and how recovered each muscle group is. The Next session panel shows what the planner suggests. Choose how many minutes you have, tap Start next session, and the day's workout opens. Each exercise has a How to button (technique cues, a specific coaching video for most exercises with a link to more videos, and, for Watson machines, a link to photos of the machine) and a Swap button offering three alternatives that do the same job, usually one machine, one free-weight and one cable option.

**How it decides what you do**

The planner works out how recovered each muscle group is from when it last trained and how many sets it did, compares each group's sets over the last seven days with a weekly target, and picks an upper-body, lower-body or full-body session. Upper and lower sessions alternate between an A and a B version with different exercises, so on four sessions a week every major muscle is trained twice; on three a week it leans on full-body sessions. Push and pull sessions are available if you choose them. It then fills your time with exercises in priority order, allowing for set-up, work and rest, adds calves or core as a short superset when the week is short of them, and uses spare minutes for extra sets.

Weights follow double progression. When you hit the top of the rep range on every set, the weight goes up next time; otherwise it stays the same and you aim for one more rep per set. Falling short of the bottom of the range twice in a row drops the weight by about ten per cent. Time away from an exercise eases the weight back (about ten per cent after two weeks, twenty after four, and a fresh calibration after eight). There are no scheduled deload weeks; the easing after time away and the per-lift back-off after repeated misses do that job when you need it. Aim to finish each set with one or two reps in reserve.

**Backing up**

Setup has Back up to a file, which opens the share sheet so you can save to Files or iCloud Drive, and Restore from a backup. Back up now and then: if the phone is lost or the app is deleted from the home screen, the data goes with it. Copy the last 14 days for Claude produces a text summary you can paste into a chat for a review of your loading.

**Updating the app later**

Upload the replacement files to the same repository, overwriting the old ones, and change the version line at the top of `sw.js` (for example to `rebuild-1.2.1`). The phone picks up the new version the next time the app is opened with signal, and the one after that shows it. Your data is unaffected.

**Known limits**

The rest timer counts from timestamps, so it is correct when you return to the app, but iOS pauses web apps when the screen locks, so the end-of-rest beep only sounds while the app is open. Keep the screen on during a session (Setup has a switch for this; Apple added support for it in home-screen web apps in iOS 18.4). Session plans are general training guidance, not medical advice.
