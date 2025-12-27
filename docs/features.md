Use this as a system-style prompt for your GPT‑5.2 coding assistant. You can paste it, then follow up with your tech stack (e.g., Laravel + React) and codebase structure.



\*\*\*



\*\*Prompt for implementing Travel Heaven features\*\*



You are an expert full‑stack engineer and software architect.  

Your task is to update an existing web app called \*\*Travel Heaven\*\* with the following product requirements.  

Generate concrete implementation steps, database changes, and example code (frontend + backend) that can be integrated into an existing project.



\### 1. Context: Travel Heaven overview



Travel Heaven is a travel planning web app with three user roles:



\- \*\*Admin\*\*

&nbsp; - Approves or rejects: locations, hotels, transportation options, with feedback text.

&nbsp; - Monitors user activity, guide profiles, reviews, and ratings.

&nbsp; - Views system‑wide statistics.



\- \*\*Guide\*\*

&nbsp; - Submits new tourist locations with photos, descriptions, and basic day‑by‑day suggestions.

&nbsp; - Adds hotels and transportation options with pricing and contact info.

&nbsp; - Tracks approval status, sees popularity of their content.

&nbsp; - Replies to traveler feedback.



\- \*\*Traveler / Tourist\*\*

&nbsp; - Browses approved locations, hotels, transportation, and guides.

&nbsp; - Creates, edits, and manages itineraries; can book services.

&nbsp; - Writes reviews and ratings.

&nbsp; - Views recommendations and manages trip expenses.



The app already exists with basic models for users, locations, hotels, transportation, itineraries, reviews, etc., plus an AI integration (Gemini) for generating travel plans.



\### 2. New traveler features to implement



Update the \*\*Traveler dashboard\*\* and AI features as follows:



1\. \*\*Traveler dashboard cards/sections\*\*

&nbsp;  - Add three sections (can be cards, tabs, or lists) on the traveler dashboard:

&nbsp;    - “Suggested Locations”

&nbsp;    - “Suggested Hotels”

&nbsp;    - “Suggested Itineraries”

&nbsp;  - Each section should:

&nbsp;    - Show items pulled from approved content (and optionally AI/guide itineraries).

&nbsp;    - Link to the relevant detail page (location detail, hotel detail, itinerary detail).



2\. \*\*AI Route Adviser integration\*\*

&nbsp;  - The AI Route Adviser should be accessed from an “Options” or similar button, not as a big “AI mode” banner, so the UI feels natural and not too AI‑ish.

&nbsp;  - When the traveler uses the AI Route Adviser to generate a plan:

&nbsp;    - The AI response \*\*must be converted into a structured “Itinerary” entity\*\* in the database.

&nbsp;    - The itinerary must be \*\*day‑by‑day\*\*, not just a flat list:

&nbsp;      - Each day has:

&nbsp;        - Day number (1, 2, 3, …)

&nbsp;        - Optional title

&nbsp;        - List of activities/places/time blocks

&nbsp;    - The newly created itinerary appears in:

&nbsp;      - Traveler’s itinerary list.

&nbsp;      - “Suggested Itineraries” section where relevant.

&nbsp;  - Make sure the AI prompt and parsing logic enforce this structure (e.g., JSON schema for days and activities).



3\. \*\*Smart Recommendation upgrade\*\*

&nbsp;  - The “Smart Recommendation” feature should also output a \*\*basic, editable day‑by‑day itinerary\*\*:

&nbsp;    - At minimum: Day 1, Day 2, Day 3… with 2–4 activities per day.

&nbsp;  - Save this result as an itinerary in the same data structure as above, so the traveler can:

&nbsp;    - Open it in the itinerary editor.

&nbsp;    - Modify days/activities later.



4\. \*\*Frontend and backend changes\*\*

&nbsp;  - Update frontend:

&nbsp;    - Traveler dashboard with 3 sections (Suggested Locations/Hotels/Itineraries).

&nbsp;    - Itinerary editor/viewer that supports multiple days and activities per day.

&nbsp;    - UI flow: use AI Route Adviser → review generated plan → save as itinerary.

&nbsp;  - Update backend:

&nbsp;    - Extend `Itinerary` model (or equivalent) to support:

&nbsp;      - association with traveler user

&nbsp;      - trip meta fields (destination, dates, budget, etc. if needed)

&nbsp;    - Add `ItineraryDay` and `ItineraryActivity` (or equivalent) entities/tables to store day‑by‑day structure.

&nbsp;    - Add API endpoints/services for:

&nbsp;      - Creating itineraries from AI responses.

&nbsp;      - Listing suggested itineraries for a traveler.



\### 3. New guide features to implement



Extend the \*\*Guide\*\* role with itinerary creation and rich location posts.



1\. \*\*Guide itineraries\*\*

&nbsp;  - Allow guides to create their own itineraries which they will lead:

&nbsp;    - These itineraries also use the same day‑by‑day structure (`Itinerary`, `ItineraryDay`, `ItineraryActivity`).

&nbsp;    - Each guide itinerary should include:

&nbsp;      - Title, destination(s), duration (number of days).

&nbsp;      - Day‑by‑day plan.

&nbsp;      - Price or “contact for price” field (optional).

&nbsp;    - Itineraries are associated with the guide user and can be:

&nbsp;      - Listed on the guide’s profile.

&nbsp;      - Discovered by travelers in “Suggested Itineraries” or “Explore”.



2\. \*\*Rich location posts\*\*

&nbsp;  - Enhance `Location` so guides can create attractive posts:

&nbsp;    - Photos (one or multiple).

&nbsp;    - Rich description (what to see, why it is attractive).

&nbsp;    - Recommended trip length (e.g., “1 day”, “2–3 days”).

&nbsp;    - Optional simple day‑by‑day outline (e.g., Day 1 highlights, Day 2 highlights).

&nbsp;  - On the \*\*Location detail\*\* page for travelers:

&nbsp;    - Show description, photos, recommended length, and day‑wise outline.

&nbsp;    - Show the owning guide’s profile snippet (name, rating, avatar).



3\. \*\*Guide contact information\*\*

&nbsp;  - Extend guide profiles with:

&nbsp;    - Phone

&nbsp;    - WhatsApp

&nbsp;    - Any other relevant contact links (e.g., website, Facebook).

&nbsp;  - On location and itinerary detail pages owned by a guide:

&nbsp;    - Display a clear “Contact Guide” section with these fields.



4\. \*\*Frontend and backend changes\*\*

&nbsp;  - Frontend:

&nbsp;    - Guide dashboard section for “My Itineraries” (CRUD).

&nbsp;    - Forms/pages for creating/editing day‑by‑day itineraries.

&nbsp;    - Updated Location creation/edit UI with:

&nbsp;      - photos upload

&nbsp;      - recommended length

&nbsp;      - optional day‑by‑day outline editor

&nbsp;    - Guide profile page showing contact info and list of itineraries/locations.

&nbsp;  - Backend:

&nbsp;    - Reuse `Itinerary` + day/activities tables for both travelers and guides with a `created\_by\_role` or similar flag.

&nbsp;    - Extend `Location` model with new fields (recommended\_length, short\_day\_plan, etc.).

&nbsp;    - Extend `GuideProfile` (or user profile) with contact fields.

&nbsp;    - Add endpoints/services for listing:

&nbsp;      - Itineraries by guide

&nbsp;      - Locations by guide

&nbsp;      - Itineraries and locations for a given destination.



\### 4. AI integration details (Gemini or other)



\- Design or refine the AI prompts so that for both AI Route Adviser and Smart Recommendation:

&nbsp; - Input includes: destination, travel dates or duration, budget level, interests, and traveler type if available.

&nbsp; - Output is \*\*strictly structured\*\* (e.g., JSON) for:

&nbsp;   - Trip meta (destination, number\_of\_days, notes).

&nbsp;   - `days: \[ { day\_number, title, activities: \[ { time\_of\_day, place\_name, description } ] } ]`.

&nbsp; - The backend then:

&nbsp;   - Parses this JSON.

&nbsp;   - Stores it into `Itinerary`, `ItineraryDay`, and `ItineraryActivity`.



\### 5. What you should produce



Given all the above, do the following:



1\. Propose or assume a typical tech stack (e.g., Laravel + React, Node + Express + React, or Django + React).  

2\. Design or update the database schema:

&nbsp;  - Show tables/entities with fields and relationships for:

&nbsp;    - `Itinerary`, `ItineraryDay`, `ItineraryActivity`

&nbsp;    - `Location` (with new fields)

&nbsp;    - `GuideProfile` (with contact info)

3\. Define REST (or GraphQL) API endpoints needed for:

&nbsp;  - Traveler dashboard suggestions.

&nbsp;  - Creating itineraries from AI responses.

&nbsp;  - Guide itinerary CRUD.

&nbsp;  - Rich location CRUD.

4\. Provide example backend code (controllers/routers/services/models) and frontend code (components/hooks/API calls) to implement the main flows:

&nbsp;  - Traveler uses AI Route Adviser → structured response → saved itinerary → visible on dashboard.

&nbsp;  - Traveler uses Smart Recommendation → basic day‑by‑day plan → saved itinerary.

&nbsp;  - Guide creates an itinerary and a rich location post → visible to travelers.

5\. Show an example AI prompt template and expected JSON response schema for the AI itinerary generation so that it can be directly implemented.



Follow these principles:

\- Keep code idiomatic and reasonably production‑like for the chosen stack.

\- Focus on clear data models and end‑to‑end flows rather than styling.

\- Make sure the design is easy to extend later (e.g., adding bookings, payments, or more AI features).



\*\*\*



You can now feed this to GPT‑5.2, and optionally add: “Tech stack: X. Current codebase: Y (briefly described)” so it tailors the code to your project.\[1]\[2]\[3]



\[1](https://chuniversiteit.nl/papers/prompt-patterns-for-software-design)

\[2](https://kinde.com/learn/ai-for-software-engineering/using-ai-for-apis/spec-driven-apis-designing-and-building-services-the-ai-friendly-way/)

\[3](https://www.reddit.com/r/LLMDevs/comments/1p6t3cp/the\_spectocode\_workflow\_building\_software\_using/)

\[4](https://www.stayvista.com/blog/best-ai-prompts-for-travel-2025-guide/)

\[5](https://bernardmarr.com/ai-travel-hacks-and-prompts-that-will-save-you-time-money-and-stress/)

\[6](https://dev.to/railsstudent/use-chromes-prompt-api-to-generate-a-trip-planner-in-angular-2kpo)

\[7](https://www.pauseandforward.com/travel-blog/ai-chatgpt-prompt-travel-plan)

\[8](https://aisuperhub.io/prompt-hub/travel)

\[9](https://www.typefox.io/blog/turn-ai-prompts-into-web-apps-using-a-semiformal-dsl/)

\[10](https://www.linkedin.com/pulse/ai-prompts-travel-itinerary-planning-your-smart-companion-nur-hasan-i42lc)

