# GuardianAI — Presentation Deck Generator

This directory contains the programmatic presentation engine and production-grade PowerPoint presentation (`.pptx`) for **GuardianAI** (Autonomous Emergency Intelligence & Disaster Response Coordination Platform).

---

## 🎯 Deliverable File Locations

### 1. Official HACK-X / SIH Presentations (New)
- **Official 7-Slide HACK-X Presentation**: [`presentation/output/GuardianAI-HACK-X-Official-Presentation.pptx`](file:///Users/abdulaziz/Desktop/Guardian-AI/presentation/output/GuardianAI-HACK-X-Official-Presentation.pptx)
- **Strict 6-Slide Maximum Ceiling Presentation**: [`presentation/output/GuardianAI-HACK-X-Strict-6Slides.pptx`](file:///Users/abdulaziz/Desktop/Guardian-AI/presentation/output/GuardianAI-HACK-X-Strict-6Slides.pptx)
- **HACK-X Generator Script**: [`presentation/src/generate_hackx_presentation.js`](file:///Users/abdulaziz/Desktop/Guardian-AI/presentation/src/generate_hackx_presentation.js)

### 2. Comprehensive 8-Slide Executive Deck
- **Generated PPTX Presentation**: [`presentation/output/GuardianAI-Presentation.pptx`](file:///Users/abdulaziz/Desktop/Guardian-AI/presentation/output/GuardianAI-Presentation.pptx)
- **Executive Generator Script**: [`presentation/src/generate_presentation.js`](file:///Users/abdulaziz/Desktop/Guardian-AI/presentation/src/generate_presentation.js)

---

## 🚀 How to Regenerate the Presentation

1. **Prerequisites**: Node.js v18+ installed on your system.
2. **Navigate to the presentation directory**:
   ```bash
   cd presentation
   ```
3. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```
4. **Run the Generator**:
   ```bash
   node src/generate_presentation.js
   ```
5. The freshly updated PowerPoint will be saved to:
   ```
   presentation/output/GuardianAI-Presentation.pptx
   ```

---

## 🎨 Visual Design System & Mandatory Template Background

The presentation is built with the **official hackathon template background**:
- **Mandatory Template Background**: `presentation/assets/slide-template-bg.png` (1920×1080 Full HD).
- **Aesthetic**: Psychedelic iridescent fluid liquid marble border (electric blue, neon magenta, cyan, and deep violet folds) framing a crisp white inner content canvas.
- **Hackathon Credentials (Slide 1 & Deck Metadata)**:
  - **Team Name**: `Dead Men Tell No Bugs`
  - **Theme**: `Disaster Management / Social Impact`
  - **Problem Statement Title**: `AI-Powered Community Disaster Intelligence & Response`
  - **Project**: `GuardianAI — Autonomous Multi-Agency Emergency Intelligence & Coordination`
- **Aspect Ratio**: 16:9 Widescreen (`13.333" x 7.5"` inches).
- **Usable Canvas**: Left margin `1.35"`, usable width `10.63"`, top margin `0.95"`, usable height `5.55"`.
- **Zero Shape Layering / No Clipping**: Cards are single-container shapes with pure text formatting inside, preventing shape clipping or black blocking boxes across PowerPoint, Keynote, and Google Slides.
- **Clean Footer-Free Canvas**: All slide footers, dividers, and slide-tag lines are removed to give content maximum breathing space inside the white card canvas.
- **Accents**:
  - `Guardian Royal Blue (#2563EB)`: Primary brand kicker, step indicators, and emphasis.
  - `Critical Crimson (#DC2626)`: Urgency Level 1, failure bottlenecks, emergency priority.
  - `Warning Amber (#D97706)`: Latency markers, telemetry indicators, warning states.
  - `Verified Green (#059669)`: Operational status, ICU capacity confirmed, build pass badges.
- **Typography**: Deep Slate 900 (`#0F172A`) for high-contrast titles, Slate 700 (`#334155`) for readable body text, and Slate 500 (`#64748B`) for metadata and subtitles.
- **Full Editability**: All diagrams, tables, metric cards, code blocks, and flow steps are native editable PowerPoint shapes and text boxes.

---

## 📑 8-Slide Executive Deck Structure

Every slide is high-density, rigorously verified against the active codebase, and formatted in an executive Light Glassmorphism theme:

| Slide | Title | Key Content & Technical Verification |
|---|---|---|
| **01** | **Title: GuardianAI** | Autonomous emergency intelligence and disaster-response coordination platform. Executive overview, team credentials, problem statement, primary tech stack (FastAPI, React 19, LangGraph, Groq, Qdrant). |
| **02** | **The Crisis Reality & Market Need** | 4 critical points of failure in legacy CAD: Signal Fragmentation, 911 Duplicate Storms, Hospital Capacity Blindspots, Misinformation Cascades. |
| **03** | **The GuardianAI Solution & Core Features** | 4 integrated operational portals: Central Command CAD, Interactive Leaflet GIS Map, Vernacular Citizen SOS (EN/TE/HI/UR), AI Misinformation Monitor. High-res screenshots embedded. |
| **04** | **How It Works — Operational Workflow** | End-to-end 6-stage lifecycle: Multilingual Intake → Gazetteer Normalization → Qdrant Vector Dedup → Clinical Severity Triage → Dynamic Hospital Triage & Bed Gate → Multi-Agency CAD Push. |
| **05** | **Multi-Agent AI & System Architecture** | 4-agent LangGraph state machine (`IntakeNode`, `DedupNode`, `MatchingNode`, `BroadcastNode`), full-stack topology, fallback chain (Groq Llama 3.3 70B → Ollama → Mock), and embedded architecture diagram. |
| **06** | **Competitive Moats & Defensibility** | 4 structural engineering moats protecting market dominance: Multi-Sensor Anti-Spoofing IP, Dynamic Capacity Triage Engine, CAD & EMR Infrastructure Lock-in, and Hyper-Local Vernacular Network Flywheel. |
| **07** | **Business Model & Monetization** | Multi-channel commercialization: B2G GovTech CAD SaaS ($250k-$800k/yr per district), B2B Hospital ER Subscriptions ($1,500-$3,500/mo), InsurTech Crash Verification API ($5-$15/query), Corporate Campus Safety ($1-$2/employee/mo). |
| **08** | **Implementation Validation, Scaled Roadmap & Conclusion** | 100% verified codebase metrics (0 TS errors, 0 lints, sub-second latency, multilingual), Phase 2-3 roadmap (National 112 CAD, Drone Recon, LoRa Mesh), and live demo access. |
