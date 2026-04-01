# THE FITNESS GARAGE — MASTER PLAN
**Last Updated:** March 26, 2026
**Owner:** Josué Hernandez
**Co-Founder:** Jose F. Alvarez (Frank)
**Location:** Texas, USA
**Website:** https://the-fitness-garage.com

---

## 1. VISION & MISSION

The Fitness Garage (TFG) is a fitness platform designed to revolutionize how people build a healthy lifestyle. The core belief: if you're not well on the inside, you won't be well on the outside — no matter what exercise you do, do it with awareness.

TFG consolidates the best features from multiple fitness apps into one unified platform that is functional, profitable, and genuinely helps people learn how to build a sustainable healthy lifestyle. The platform serves personal trainers, professional runners, swimmers, gymnasts, and any fitness professional who wants to manage clients with standardized routines.

**Key Differentiator:** TFG is not just another workout app. It's a complete business management system for fitness professionals AND a lifestyle transformation tool for their clients.

---

## 2. TEAM & ROLES

| Person | Role | Responsibilities |
|--------|------|-----------------|
| Josué Hernandez | CEO / Founder / App Developer | Vision, business strategy, iOS app development, marketing content, client relations |
| Jose F. Alvarez (Frank) | Co-Founder / Head Trainer | Training methodology, client management, content creation, in-person training |
| BinaryClouds (India) | Web Development Team | Phase 1 web platform (completed), Phase 2 web development (pending quotation) |
| Revathi Suresh | BinaryClouds Project Manager | Main contact for web development coordination |

---

## 3. PLATFORM ARCHITECTURE

TFG operates on two platforms that share the same backend:

### 3.1 Web Platform (the-fitness-garage.com)
- **Tech Stack:** Next.js, Next-Auth (session cookies), Stripe payments
- **Status:** Phase 1 ~60% operational (pending payment method completion)
- **Developer:** BinaryClouds

### 3.2 iOS Mobile App
- **Tech Stack:** SwiftUI, Firebase (Auth + Firestore + Storage), connects to web API via REST
- **Version:** v2.17 (March 26, 2026)
- **Status:** Core modules + real-time calendar sync + booking system + cosmic login UI + voice command system fully developed. 2 placeholder modules remaining (Workouts, Chat). App Store launch in progress via TestFlight with 22 existing clients.
- **Login UI:** Cinematic cosmic design with shockwave rings, orbiting comets, meteorite field, and epic slogan effects
- **Developer:** Josué Hernandez (Xcode project at ~/Desktop/Desaroollo de Aplicacion/fitnessgarage/)
- **Auth:** Dual authentication — Firebase Auth + web API session (Next-Auth cookies)
- **Voice System:** Apple Speech (free, on-device) for commands + OpenAI (paid) for reasoning

---

## 4. WEB PLATFORM — COMPLETE MODULE MAP

### 4.1 User Side (Client View)
| Module | Status | Description |
|--------|--------|-------------|
| Dashboard | Phase 1 ✅ | Main landing after login |
| My Sessions / Bookings | Phase 1 ✅ | View upcoming and past training sessions |
| Nutrition Tracker | Phase 1 ✅ | Daily meal logging with macros (calories, protein, carbs, fat). Resets daily, stores by date |
| Recipe Catalog | Phase 1 ✅ | Browse trainer-curated recipes with full nutritional info |
| Membership | Phase 1 ✅ | View active subscription, plan details |

### 4.2 Admin Side (Trainer/Manager View)
| Module | Status | Description |
|--------|--------|-------------|
| Dashboard | Phase 1 ✅ | Admin overview |
| Manage Users | Phase 1 ✅ | Full user management — view, edit, delete users. Each user card shows: name, email, status, plan, joined date |
| Manage Trainers | Phase 1 ✅ | Trainer profiles with 3 actions: View Availability (clock icon → calendar), Edit (pencil), Delete (trash) |
| Bookings | Phase 1 ✅ | View all appointments across all trainers and clients |
| Membership Management | Phase 1 ✅ | Manage subscription plans, pricing, features. Stripe integration with On Hold / Reactivate controls |
| Membership Section | Phase 1 ✅ | Plan configuration and offerings display |
| Nutrition | Phase 1 ✅ | Manage recipe catalog — add recipes with: name, category (Breakfast/Dinner/Indian/Other), calories, protein, carbs, fat, ingredients list, preparation steps, image |
| Group Class | Phase 1 🔄 | Started but incomplete — to be finished in Phase 2 |
| Settings | Phase 1 ✅ | Trainer schedule configuration — set available days and time blocks per day |
| Report / Analytics | Phase 1 ✅ | Platform analytics and reporting |
| Manage Category | Phase 1 ✅ | Category management for recipes and content |
| Coupons | Phase 1 ✅ | Promotional coupon management |
| FAQ | Phase 1 ✅ | Frequently asked questions management |
| Payment Logs | Phase 1 ✅ | Transaction history and payment tracking |

### 4.3 Calendar & Booking System (Critical Architecture)
- **Settings** → Trainer defines available days and hourly blocks (e.g., Mon-Fri 7AM-5PM)
- **Manage Trainer → Availability** (clock icon) → Shows weekly calendar with 1-hour slots in color:
  - 🟢 Green = Available slot
  - 🔴 Red = "Booked by [Client Name]" (One-on-One)
  - 🟠 Orange = "Extra Session" (booked from iOS app, not a subscription)
- **Mirror Weeks (Semanas Espejo):** One-on-One clients have fixed weekly time slots that auto-replicate across 5 visible weeks. Each client owns their slot at the same day/time every week.
- **Bookings page** → Aggregate view of all appointments
- **Real-Time Sync (v2.17):** Admin panel → Firestore → iOS app. The iOS app acts as a "panel scanner" — reads ALL slot data from Firestore, identifies each cell (available/booked/disabled), and only displays available slots. If the trainer extends hours, the app detects the panel growth automatically. Auto-refresh every 10 seconds for near-real-time updates. Bookings made from iOS write back to Firestore and appear on admin dashboard instantly.
- **Trainers:** Frank Alvarez (Garage, 7AM-5PM), Josue Hernandez (Online, 5PM-8PM). Shift hours stored in Firestore for dynamic configuration.

### 4.4 Subscription Model
| Plan | Price | Billing | Description |
|------|-------|---------|-------------|
| One-on-One | $200/week | Weekly (Stripe) | In-person 1-hour sessions, fixed calendar slot via Mirror Weeks |
| Fitness Tracker | $199/month | Monthly (Stripe) | Online membership (Phase 2 will add video sessions) |

**CRITICAL WARNING:** On Hold and Reactivate buttons directly affect Stripe billing. Double confirmation dialogs protect all money-affecting actions.

### 4.5 Pending Phase 1 Item
- **Payment Methods:** Need to enable both ACH and credit card payment options. Currently limited. This is blocking real user launch.

---

## 5. iOS APP — COMPLETE MODULE MAP

### 5.1 Developed Modules (Functional)
| Module | File(s) | Description |
|--------|---------|-------------|
| Login | LoginView.swift, FirebaseManager.swift | Cinematic cosmic design with shockwave rings, orbiting comets, meteorite field, diamond-decorated slogan, glassmorphic form. Firebase Auth + Google Sign-In, dual auth with web API |
| Garage (Home) | ContentView.swift (GarageView) | Hero section, motivational quotes rotation, Today card, Membership card, Trainer card + notes, Weight Progress, Progress Tracker, Community card |
| Weight Progress | ContentView.swift (WeightProgressCard) | Interactive chart with time filters (1M/3M/6M/12M/2Y/ALL), smart colors (green = on track, red = off track based on user goal), add/edit/delete entries |
| Progress Tracker | ProgressTrackerView.swift, ProgressTrackerManager.swift | Before/After photo comparison with body measurements, variation tracking, improvement counting |
| Recipes | RecipesView.swift, RecipeManager.swift | Full recipe catalog browsing |
| Meal Planner | MealPlannerView.swift, MealPlannerManager.swift | Meal planning functionality |
| Voice Commands | VoiceManager.swift, VoiceRouter.swift, LocalCommandParser.swift, VoiceButtonView.swift | Dual-engine voice system: Apple Speech (free, on-device) for navigation/data entry, OpenAI (paid) for reasoning/open-ended questions. TFG ACCESS mode with TimelineView + Canvas animations |
| My Fitness Profile | ContentView.swift (MyFitnessProfileView) | User profile with all fitness data |
| API Manager | APIManager.swift | REST connection to the-fitness-garage.com: auth, user data, weight logs, progress, nutrition |
| Unit Manager | UnitManager.swift | Imperial/Metric unit conversion system |
| Secret Management | Secret.swift, Secrets.plist | API key management |

### 5.2 Newly Developed Modules (v2.16 ✅)
| Module | File(s) | Description |
|--------|---------|-------------|
| Book Session | BookSessionView.swift, BookingManager.swift | Full booking calendar with weekly grid, trainer selection, real-time Firestore sync (10-second auto-refresh). Dynamic panel scanner reads shift hours from Firestore — if trainer extends hours, app adapts automatically. Timezone-aware: past slots gray, <12h light green + contact alert, available = green. Booked/disabled slots completely hidden. Session booking writes to Firestore as "Extra Session" (orange on admin dashboard) |
| My Bookings | MyBookingsView.swift | View upcoming and past training session bookings |
| Subscription Plans | SubscriptionView.swift | Membership plan display and management |
| Tab Icons | TabIcons.swift | Custom animated tab bar icons for all modules |
| Login Redesign | LoginView.swift | Cosmic Login UI - Cinematic login with shockwave rings, orbital comet system, meteorite field, diamond-decorated slogan, glassmorphic form |

### 5.3 Placeholder Modules (Not Yet Built)
| Module | Tab Name | Priority | Notes |
|--------|----------|----------|-------|
| Workouts | workouts | Phase 2 | Exercise logging, sets, reps, weights — depends on Training Module |
| Chat | chat | Phase 2 | Direct messaging with trainer |

### 5.4 App Store Launch Plan
- **TestFlight beta:** Deploy to 22 existing clients for real-world testing
- **Beta testing period:** 2-4 weeks for bug reports and feedback
- **App Store Review:** Submit to Apple for review
- **Public launch:** Available on App Store

### 5.5 Server Migration Plan
- **Current:** BinaryClouds-managed hosting
- **Target:** TFG-owned AWS accounts
- **Steps:**
  - AWS account setup
  - Stripe sync migration
  - Firebase project ownership verification
  - DNS migration
  - SSL certificates

### 5.6 Future Platform Expansion
- **macOS app development** — SwiftUI shared codebase for desktop fitness management
- **AI Assistant integration** — Conversational fitness coaching for personalized workouts and nutrition
- **Agent-based automation** — Scheduled reports, client alerts, nutrition AI recommendations

### 5.7 App Voice Architecture
```
User speaks → Apple SFSpeechRecognizer (free, on-device)
  → VoiceRouter.classify(transcript)
    ├─ .local → LocalCommandParser (free, instant)
    │   ├─ weightEntry: "Registra 180 libras"
    │   ├─ logReps: "12 reps", "3 series de 10"
    │   ├─ logCalories: "200 calorías"
    │   ├─ navigate: "ir a rutinas", "open progress"
    │   ├─ action: "start workout", "next exercise"
    │   └─ updateField: "cambiar peso a 180"
    └─ .openAI → GPT reasoning (paid)
        └─ Open-ended: "¿cómo voy este mes?", "suggest a meal"
```

---

## 6. PHASE 2 — PLANNED DEVELOPMENT (Web)

Quotation requested to BinaryClouds on March 13, 2026. Awaiting module-by-module pricing.

| # | Module | Description | Complexity |
|---|--------|-------------|------------|
| 1 | Online Membership | Split calendar: 30-min blocks for online users alongside 1-hour in-person. Video call link auto-generation. Review Week = online users can only view (not book) current week | HIGH |
| 2 | Training Module | Exercise Library (video/GIF catalog), Routine Builder (TFG Training Lab), Weekly Routine Assignment, User Workout View (sequential playback with timer) | HIGH |
| 3 | Internal Messaging (Chat) | Optional module — requested two quotes (with/without chat) | MEDIUM |
| 4 | Role-Based Access | General Manager (full access) vs Trainer (limited to own calendar/clients only) | MEDIUM |
| 5 | Nutrition Tracker History | Daily reset with date-based storage, foundation for analytics | LOW |
| 6 | Weekly Report | Auto-generated from: workout completion %, nutrition logging consistency, macro adherence, weight trend | MEDIUM |
| 7 | AI Food Logging | Text/image to macro estimation via API. Separate quote requested | HIGH |
| 8 | Nutrition Catalog Visual Improvement | UI/UX improvements to recipe catalog | LOW |
| 9 | Manual Invoice Adjustment | Adjust Stripe invoices directly from platform | LOW |
| 10 | Group Classes Completion | Finish module started in Phase 1 | MEDIUM |

---

## 7. BUSINESS STRATEGY — NEW CONTRACT MODEL

### Current Situation
- BinaryClouds built Phase 1 under THEIR contract
- TFG does NOT own the source code (contract issue)
- Josué plans to purchase/acquire the code

### New Model (To Implement)
- TFG will issue its own contract to BinaryClouds
- Monthly salary payment structure (no per-project pricing)
- ALL intellectual property and code ownership belongs to TFG
- BinaryClouds handles web Phase 2 development
- Josué handles iOS app development independently

### Action Items
1. **Register IP/Copyright in Texas** — PRIORITY #1
2. **Purchase existing Phase 1 code** from BinaryClouds
3. **Draft new TFG-owned contract** with IP ownership clauses
4. **Negotiate monthly salary** (pending Phase 2 quotation response)

---

## 8. INTELLECTUAL PROPERTY

### Registered
- **Brand:** "The Fitness Garage" — trademark registered
- **Domain:** the-fitness-garage.com — active

### Pending Registration
- **IP Registration in Texas** — to protect the business idea (Josué + Frank)
- **Copyright on software** — web platform + iOS app

### Evidence Documented
- Email communications from Dec 2025 - Jan 2026 showing Josué as project lead
- Organized in: `/TFG_IP_Protection/` folder with monthly email evidence
- Summary document: `IP_DOCUMENTATION_SUMMARY.md`
- Full documentation: `2TFG_IP_Documentation_2026.docx`

---

## 9. FINANCIAL STATUS

### Revenue
- Platform has NOT launched with real paying users yet
- Launch blocked by payment method completion (ACH + credit card)
- Phase 1 development has been continuous investment

### Costs
- BinaryClouds development fees (Phase 1)
- Domain and hosting
- Stripe fees (when active)
- OpenAI API costs (voice system, per-use)
- Apple Developer Program ($99/year)

### Next Steps
- Complete payment methods → Launch with real users → Generate revenue
- Seek investors after demonstrating traction

---

## 10. MARKETING ASSETS

### Available Content
- Professional photos (nathanpaulphotography sessions)
- iPad screenshots of platform
- Training videos of clients
- Josué's personal transformation (110+ lbs lost)
- Client transformations (160+ lbs lost testimonials)
- Before/after photos and videos
- Logo variations and branded merchandise designs
- Testimonials documented

### Content Location
- `/03_Marketing/Fotos/` — all photos (TFG, iPad, intro, nathanpaulphotography)
- `/03_Marketing/Videos/` — training and promo videos
- `/03_Marketing/Reviews/` — client reviews and images
- `/03_Marketing/Testimonios/` — compiled testimonials
- `/06_Branding/Logos/` — brand logos
- `/06_Branding/Merchandise/` — merchandise designs (shirts etc.)

---

## 11. PROJECT FILE STRUCTURE

```
The Fitness Garage/
├── TFG_MASTER_PLAN.md                  ← THIS FILE (project context)
├── TFG_TASK_BOARD.html                 ← Interactive task management
│
├── 01_Legal/
│   ├── IP_DOCUMENTATION_SUMMARY.md     ← IP evidence summary
│   ├── 2TFG_IP_Documentation_2026.docx ← Full IP documentation
│   ├── TFG_IP_Protection/              ← Email evidence by month (10-12/2025, 01-03/2026)
│   ├── Fitness Garage - SLA.pdf        ← Service Level Agreement
│   └── Terminos y condiciones/         ← Terms and conditions
│
├── 02_Development/
│   ├── Fase_2/                         ← Phase 2 specs, mockups, screenshots
│   ├── Web_Phase_1/                    ← Phase 1 docs, revisions, change logs
│   └── Respuestas correo/             ← Email correspondence with dev team
│
├── 03_Marketing/
│   ├── Fotos/                          ← All photos (TFG, iPad, intro, pro shoots)
│   ├── Videos/                         ← Training and promo videos
│   ├── Reviews/                        ← Client reviews and images
│   ├── Testimonios/                    ← Compiled testimonials
│   └── Frank Voice/                    ← Voice recordings
│
├── 04_Finance/                         ← Financial documents (to be added)
│
├── 05_Content/
│   ├── Recetas/                        ← Recipes and food content
│   ├── Programas_Entrenamiento/        ← Training programs
│   ├── Documentacion_Plataforma/       ← Membership docs, FAQs, instructions, profiles
│   ├── Manual/                         ← Platform manuals
│   └── Libro/                          ← Book content
│
└── 06_Branding/
    ├── Logos/                          ← Brand logos
    └── Merchandise/                    ← Shirt designs, branded items
```

---

## 12. CURRENT PROJECT STATUS SUMMARY

| Area | Status | Blocking Issues |
|------|--------|----------------|
| Web Phase 1 | ~60% operational | Payment methods (ACH + CC) not enabled |
| Web Phase 2 | Quotation requested | Awaiting BinaryClouds response |
| iOS App | v2.17 — Cosmic login + Calendar sync + Booking + Voice system live | TestFlight deployment pending |
| App Store Launch | TestFlight phase | Pending beta testing with 22 clients |
| iOS ↔ Web Sync | Connected — real-time Firestore | Weight Progress + Calendar slots syncing |
| IP/Legal | Documents prepared + IP Registration Document created | Registration pending filing |
| AI Infrastructure | Planning phase | Agent architecture being designed |
| Contract | Strategy defined | New contract not yet drafted |
| Marketing | Assets collected | No campaigns launched yet |
| Finance | Pre-revenue | Blocked by payment method + launch |
| Launch | Not yet | Blocked by payment methods |

---

## 13. AI & AUTOMATION INFRASTRUCTURE

### AI Assistant
- **Purpose:** Conversational fitness coach using OpenAI/Claude APIs
- **Features:** Personalized workout recommendations, nutrition guidance, progress analysis
- **Integration:** Accessed through iOS app voice commands and web platform interface

### Agent System
- **Automated Tasks:** Weekly reports, client alerts, nutrition logging automation
- **Scheduling:** Cron-based background jobs for recurring tasks
- **Notifications:** Real-time push notifications and email summaries
- **Scalability:** Agent architecture designed for multiple concurrent client sessions

### Voice Integration
- **Dual-Engine System:** Apple Speech Recognition (on-device) + OpenAI API (cloud)
- **Current Status:** Fully integrated in iOS app v2.17
- **TFG ACCESS Mode:** Timeline-based interface with Canvas animations for premium voice features

### Data Pipeline
- **Flow:** Client data (workouts, nutrition, weight) → AI analysis → Personalized recommendations
- **Real-time Sync:** Firestore integration for immediate data availability to AI systems
- **Feedback Loop:** Client responses inform AI model improvements

### Security
- **API Keys:** Managed via Secrets.plist with encrypted storage
- **Role-Based Access:** AI features gated by subscription tier
- **Data Privacy:** Client data processed securely with compliance to GDPR/CCPA standards
- **Token Management:** OpenAI and Firebase tokens refreshed automatically

---

## 14. HOW TO USE THIS DOCUMENT

**For AI Sessions:** Read this file at the start of any conversation about TFG. It contains the complete project context. Then ask Josué which area to focus on (programming, marketing, finance, or legal).

**For Josué:** When you open a new AI chat, tell it: "Read TFG_MASTER_PLAN.md in my The Fitness Garage folder" — this gives instant context.

**Updating:** When significant changes happen (new module completed, contract signed, launch date set), update the relevant section and change the "Last Updated" date at the top.

---

*Document created March 23, 2026 by Josué Hernandez with AI assistance.*
*Updated March 26, 2026 — v2.17: Cosmic login redesign, TestFlight deployment, App Store launch plan, Server migration plan, Future expansion roadmap, AI infrastructure documented.*
