# GuardianAI

A multi-agent emergency intelligence and disaster-response coordination platform designed to connect emergency reports, AI reasoning, resource discovery, responder coordination, misinformation monitoring, and operational dashboards.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2.34-1C3C3C?style=flat-square&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Nomic_Embed-000000?style=flat-square&logo=ollama&logoColor=white)](https://ollama.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-1.11-DC2626?style=flat-square&logo=qdrant&logoColor=white)](https://qdrant.tech/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)

---

## 📌 Overview

During natural disasters and large-scale humanitarian crises, emergency response operations are severely hampered by information fragmentation. Distress calls and incident reports flood in simultaneously across voice calls, SMS, social channels, and messaging apps—often in unstructured formats, multiple regional languages, or colloquial code-switching.

At the same time, emergency responders, NGO field teams, and civil defense coordinators lack a unified operational picture. Critical hospital bed availability and ICU capacity fluctuate rapidly, duplicate reports overwhelm intake operators, and unverified rumors create dangerous logistical bottlenecks.

**GuardianAI** is an AI-assisted disaster-response coordination platform that unifies victim distress reporting, multi-agent intelligence extraction, semantic incident deduplication, capacity-aware hospital matching, and real-time operational command into an integrated workflow.

Powered by **LangGraph**, **FastAPI**, **ChatGroq (Llama 3.3 70B)**, **Ollama (`nomic-embed-text`)**, **Qdrant Vector Database**, and **React 19 + TypeScript**, GuardianAI demonstrates how specialized AI agents can collaborate in a deterministic stateful pipeline to assist human emergency coordinators with high-confidence decision support.

> [!NOTE]
> **Prototype Demonstration & Human-in-the-Loop Architecture**:
> GuardianAI is designed as an operational prototype and architectural reference. In live emergency management, automated AI recommendations serve solely as decision support for qualified human incident commanders. Real-world deployments require integration with official Computer-Aided Dispatch (CAD) systems, civil defense APIs (e.g., 112 / 911), and rigorous safety audits.

---

## 🚨 Problem

Emergency response operations during acute crises face several persistent operational breakdowns:

- **Fragmented & Unstructured Distress Reports**: Victims report emergencies through varied channels in informal, multilingual phrases (Hindi, Telugu, Urdu, English), often lacking precise coordinates or structured metadata.
- **Duplicate Report Storms**: Multiple individuals in the same neighborhood frequently report the identical incident (e.g., urban flooding or building fires), overwhelming dispatchers and obscuring the true geographic cluster boundaries.
- **Resource Mismatch & Hospital Overcrowding**: Injured victims are often routed to the nearest recognizable hospital without visibility into real-time ICU bed occupancy, available trauma specialists, or capacity limits, leading to dangerous triage bottlenecks.
- **Siloed Responder Agencies**: Police, fire brigades, medical personnel, volunteer groups, and NGOs operate with differing visibility requirements and permission boundaries, leading to conflicting coordination efforts.
- **Misinformation & Unverified Rumors**: Viral social media rumors regarding broken dams, closed shelters, or fake emergency hotlines induce public panic and misdirect scarce rescue assets.
- **Manual, High-Latency Workflow**: Triaging reports, looking up facility capacity, computing driving distances, and dispatching field teams manually introduces delays during the golden hour of disaster response.

---

## 💡 Solution

GuardianAI resolves these operational bottlenecks through an orchestrated multi-agent emergency intelligence pipeline:

```
Victim / Citizen
  │ (Multilingual Text / Speech)
  ▼
React 19 Frontend Web Client
  │ (HTTP POST /api/pipeline/run)
  ▼
FastAPI Gateway & Role Router
  │
  ▼
LangGraph Multi-Agent Orchestrator
  │
  ├── 1. Victim Assistance Agent ──────► Intent, Needs & Coordinate Extraction (Groq / Llama-3.3-70B)
  │                                      & Reassuring Shelter Guidance
  │
  ├── 2. Emergency Intelligence Agent ─► 768-dim Embedding (Ollama) & Vector Search (Qdrant)
  │                                      Semantic Deduplication, Incident Clustering & Confidence
  │
  ├── 3. Resource Finder Agent ────────► Geodesic Distance, ICU / Bed Multi-Factor Scoring,
  │                                      Capacity Allocation & Live In-Memory Decrementing
  │
  └── 4. NGO Dashboard Agent ──────────► Operational Aggregation, Plain-Language Justification,
                                         & Role-Based Dispatch Formatting
  │
  ├──► PostgreSQL Database (Relational Incidents, Reports, Facilities, Users)
  ├──► Qdrant Vector Store (High-Dimensional Semantic Incident Index)
  │
  ▼
Real-Time WebSocket Dispatch (/ws/dashboard)
  │
  ▼
Responder Command Center & Live Operations Dashboard (Leaflet GIS, Action Plans, Misinformation Monitor)
```

1. **Multilingual Victim Intake**: Victims interact via a mobile-friendly conversational interface supporting text and voice dictation in English, Hindi, Telugu, Urdu, or transliterated vernacular.
2. **Deterministic Multi-Agent Coordination**: A sequential LangGraph `StateGraph` routes distress reports through four specialized agents, transforming raw narrative messages into validated operational incidents.
3. **High-Speed Semantic Deduplication**: High-dimensional vector embeddings generated by local Ollama instances (`nomic-embed-text`) are indexed in Qdrant, clustering incoming reports by geographic proximity and incident type.
4. **Capacity-Aware Hospital Allocation**: The system scores nearby hospitals based on Haversine distance, ICU availability percentage, total bed availability, and specialty matching (e.g., trauma, cardiac, orthopedic), proportionally distributing patients and updating live capacity.
5. **Real-Time Operational Command**: The unified incident payload is broadcast via WebSockets to the Responder Command Center, rendering live Leaflet maps, AI Action Plans with human-in-the-loop approval gates, misinformation tracking, and volunteer assignment.

---

## ✨ Key Features

### 👤 Victim & Citizen Assistance
- **Multilingual Emergency Chat**: Conversational emergency intake recognizing English, Telugu, Hindi, Urdu, and code-switched vernacular.
- **Voice-to-Text Dictation**: Integrated browser Web Speech API allowing hands-free voice reporting during active crisis conditions.
- **Immediate Reassurance & Shelter Guidance**: Instant feedback confirming report receipt and directing victims to the nearest validated emergency shelter (e.g., regional relief camps).

### 🧠 AI Emergency Intelligence & Deduplication
- **Automated Entity & Coordinate Extraction**: Extracts place names, need types (`fire`, `flood_rescue`, `medical`, `shelter`, `food`, `other`), and urgency tiers (`low`, `medium`, `high`, `critical`) using Groq-accelerated Llama 3.3 70B.
- **Spatial Gazetteer Resolution**: Maps colloquial neighborhood names (e.g., Ameerpet, Banjara Hills, Kukatpally, Secunderabad) to precise geographic coordinates.
- **Vector-Based Incident Clustering**: Generates 768-dimensional embeddings and executes cosine similarity searches in Qdrant (similarity threshold $\ge 0.82$) to group redundant reports into a single consolidated incident.
- **Calibrated Confidence Scoring**: Mathematically scales incident confidence based on cluster corroboration density ($C = \min(0.60 + (\text{cluster\_size} \times 0.08), 0.98)$).

### 🏥 Capacity-Aware Resource Allocation
- **Multi-Factor Hospital Scoring**: Ranks medical facilities using a composite suitability formula combining ICU availability ($60\%$), general bed capacity ($30\%$), and specialty bonuses ($+10\%\text{--}15\%$ for trauma/cardiac/orthopedics).
- **Geodesic Proximity Computation**: Calculates real-time distance using Haversine formulas between incident coordinates and hospital locations.
- **Proportional Patient Distribution**: Balances patient load across top-ranked hospitals to prevent emergency room overwhelm.
- **Live Decrementing Inventory**: Decrements hospital bed and ICU counters in memory to ensure sequential incident allocations reflect up-to-the-minute capacity.

### 🛡️ Responder Command Center & Operational Workspace
- **Role-Based Operational Views**: Granular access control for `NGO`, `Disaster Management`, `Fire Brigade`, `Medical`, `Police`, and `Volunteer Coordinator`.
- **Live Interactive Emergency Map**: High-performance Leaflet map with OpenStreetMap tiles displaying urgency-coded incident clusters with victim count badges.
- **Human-in-the-Loop Action Plans**: Detailed AI hospital assignment recommendations with expandable clinical reasoning and explicit **Approve Plan** / **Override** decision logging.
- **Misinformation Monitoring**: Flagged rumor surveillance board tracking viral unverified posts (WhatsApp forwards, Twitter/X claims) with AI confidence ratings and one-click public warning issuance.
- **Volunteer Coordination**: Field volunteer roster tracking locations, skills (First Aid, Boat Operator, Nurse, Logistics), and real-time dispatch assignment.
- **Relief Resource Directory**: Live tracking of non-medical facilities including emergency shelters, water tanker points, mobile food vans, and charging stations.
- **Analytics & Reporting**: Visual incident breakdowns by disaster category, confidence metrics, and one-click tabular CSV report downloads.
- **One-Click Demo Reset Engine**: Dedicated administrative endpoint (`POST /api/admin/reset`) that purges Qdrant vector collections and reloads pristine hospital capacities for repeatable demonstrations.

---

## 🤖 AI / Multi-Agent System

GuardianAI implements a deterministic, multi-agent architecture orchestrated by **LangGraph** (`StateGraph`). Rather than relying on a single monolithic LLM prompt or an unconstrained conversational agent, GuardianAI divides emergency coordination into four modular, specialized agents connected by an explicit shared state object (`PipelineState`).

```mermaid
flowchart TD
    subgraph Client["Presentation Layer"]
        User(["Victim / Citizen Report"])
        Dashboard(["Responder Command Center"])
    end

    subgraph Gateway["API Gateway (FastAPI)"]
        API["/api/pipeline/run"]
        WS["/ws/dashboard (WebSocket)"]
    end

    subgraph LangGraph["LangGraph Multi-Agent Orchestrator"]
        State[("PipelineState")]
        Node1["1. Intake Node<br/>(Victim Assistance Agent)"]
        Node2["2. Dedup Node<br/>(Emergency Intelligence Agent)"]
        Node3["3. Match Node<br/>(Resource Finder Agent)"]
        Node4["4. Dashboard Node<br/>(NGO Dashboard Agent)"]
    end

    subgraph Data["Persistence & Vector Layer"]
        Groq[("Groq Cloud<br/>Llama-3.3-70B")]
        Ollama[("Ollama<br/>nomic-embed-text")]
        Qdrant[("Qdrant<br/>Vector Store")]
        Postgres[("PostgreSQL<br/>Relational DB")]
    end

    User -->|Submit Text / Voice| API
    API -->|ainvoke| Node1
    Node1 <-->|LLM Extraction & Guidance| Groq
    Node1 -->|State Update| Node2
    Node2 <-->|Generate 768-dim Vector| Ollama
    Node2 <-->|Cosine Search & Upsert| Qdrant
    Node2 -->|State Update| Node3
    Node3 -->|Haversine + Capacity Rules| Node4
    Node4 -->|Action Plan Payload| State
    State -->|Final Output| API
    API -->|Broadcast Event| WS
    WS -->|Live Update Push| Dashboard
    API -.->|Persist Records| Postgres
```

### 1. Victim Assistance Agent
- **Technology**: LangChain + `ChatGroq` (`llama-3.3-70b-versatile`, `temperature=0`)
- **Pipeline Node**: `intake_node`
- **Responsibilities**:
  - Ingests raw, unstructured user distress messages in English, Hindi, Telugu, Urdu, or code-switched transliterations.
  - Extracts structured JSON entities: `location_text`, `need_type` (`fire`, `flood_rescue`, `medical`, `shelter`, `food`, `other`), `urgency` (`low`, `medium`, `high`, `critical`), and `language_detected`.
  - Resolves geographic coordinates via local gazetteer lookups (`resolve_coordinates`).
  - Generates a calm, culturally attuned, reassuring response acknowledging report receipt and providing the nearest verified shelter location.

### 2. Emergency Intelligence Agent
- **Technology**: Ollama (`nomic-embed-text`, 768-dim embeddings) + Qdrant Client
- **Pipeline Node**: `dedup_node`
- **Responsibilities**:
  - Constructs a weighted semantic query string (`f"{need_type} {need_type} incident at {location_text}"`) to ensure incident type weighting.
  - Computes 768-dimensional dense vector embeddings via local Ollama inference.
  - Performs cosine similarity vector search against the `guardian_incidents` collection in Qdrant.
  - Evaluates similarity scores against a strict threshold ($\ge 0.82$) combined with exact `need_type` verification.
  - Deduplicates incoming reports into an existing `incident_id` or provisions a new incident cluster, incrementing cluster size and estimated victim count ($\text{cluster\_size} \times 6$).
  - Computes calibrated confidence metrics and upserts the point structure into Qdrant.

### 3. Resource Finder Agent
- **Technology**: Deterministic Capacity-Aware Rules Engine & Geodesic Mathematics
- **Pipeline Node**: `match_node`
- **Responsibilities**:
  - Calculates Haversine geodesic distances ($d_{\text{km}}$) between incident coordinates and regional hospitals.
  - Evaluates facility suitability using a multi-factor scoring function:
    $$\text{Score} = (\text{ICU Availability \%} \times 0.6) + (\text{Bed Availability \%} \times 0.3) + \text{Specialist Bonus}$$
  - Applies clinical specialty bonuses ($+0.15$ for trauma in fire/flood incidents, $+0.10$ for cardiac/general in medical emergencies, $+0.15$ for orthopedic).
  - Ranks candidate facilities and executes proportional victim distribution across the top 3 hospitals based on available bed shares.
  - Decrements live in-memory hospital capacity (`available_beds`, `icu_available`) to prevent duplicate over-allocation across concurrent incidents.
  - Synthesizes plain-language clinical reasoning statements (e.g., *"Hospital B ICU capacity moderate (57%)"*).

### 4. NGO Dashboard Agent
- **Technology**: Operational Synthesis & Role Dispatch Engine
- **Pipeline Node**: `dashboard_node`
- **Responsibilities**:
  - Merges outputs from the Victim Assistance, Emergency Intelligence, and Resource Finder agents into a unified operational dispatch record.
  - Resolves appropriate responder agency roles (`medical`, `fire_brigade`, `ngo`, `disaster_management`) based on incident classification.
  - Assembles the complete incident payload containing action plans, reasoning justifications, confidence scores, victim counts, map coordinates, and ISO timestamps.
  - Formats the payload for broadcast over the WebSocket event stream to connected responder dashboards.

---

## 🔄 How It Works

```mermaid
sequenceDiagram
    autonumber
    actor Victim as Victim / Citizen
    participant App as React Frontend
    participant API as FastAPI Gateway
    participant LG as LangGraph Orchestrator
    participant Groq as Groq (Llama 3.3)
    participant Ollama as Ollama Embeddings
    participant Qdrant as Qdrant Vector DB
    participant WS as WebSocket Dispatcher
    actor Responder as Incident Commander

    Victim->>App: Submits text or voice distress report
    App->>API: POST /api/pipeline/run
    API->>LG: ainvoke(PipelineState)
    
    rect rgb(20, 30, 50)
        Note over LG,Groq: Stage 1: Victim Assistance
        LG->>Groq: Prompt: Extract entities, need type & urgency
        Groq-->>LG: { location_text, need_type, urgency, victim_reply }
    end

    rect rgb(25, 20, 50)
        Note over LG,Qdrant: Stage 2: Emergency Intelligence
        LG->>Ollama: Embed "need_type incident at location"
        Ollama-->>LG: 768-dim dense embedding
        LG->>Qdrant: Search cosine similarity >= 0.82
        Qdrant-->>LG: Matching incident cluster or new cluster ID
        LG->>Qdrant: Upsert point payload
    end

    rect rgb(20, 45, 40)
        Note over LG: Stage 3: Resource Finder
        LG->>LG: Calculate Haversine distances & hospital scores
        LG->>LG: Proportional distribution & live bed decrement
    end

    rect rgb(45, 30, 20)
        Note over LG: Stage 4: NGO Dashboard Synthesis
        LG->>LG: Formulate action plan & responder routing
    end

    LG-->>API: Returns final operational payload
    API->>WS: Broadcast { type: "incident_update", payload }
    WS-->>Responder: Live WebSocket push updates Command Center
    API-->>App: Returns victim_reply ("Help is on the way...")
    App-->>Victim: Displays localized reassurance & shelter location
    Responder->>API: POST /api/responder/decision (Approve Plan / Override)
```

1. **Distress Submission**: A citizen submits a natural-language emergency message (e.g., *"i need help, water in my house, banjarahills"*) or records a voice note.
2. **Gateway Ingestion**: The client dispatches the request to FastAPI (`POST /api/pipeline/run`), initializing a `PipelineState` dictionary.
3. **Entity & Need Extraction**: The Victim Assistance Agent invokes Groq (`llama-3.3-70b-versatile`) to extract location, urgency, and need classification, resolving spatial coordinates.
4. **Immediate Victim Feedback**: A reassuring confirmation message with the nearest relief shelter is generated and returned to the citizen interface.
5. **Vector Embedding Generation**: The Emergency Intelligence Agent invokes local Ollama (`nomic-embed-text`) to generate a 768-dimensional dense vector representing the incident.
6. **Vector Search & Deduplication**: The agent queries Qdrant to find existing incidents matching the location and need type ($\text{similarity} \ge 0.82$). If found, the report is merged into the cluster; otherwise, a new incident ID is created.
7. **Resource Optimization**: The Resource Finder Agent computes Haversine distances to regional hospitals, scores facilities on ICU availability and specialty fit, and allocates victim counts proportionally.
8. **Live Inventory Decrement**: The in-memory hospital capacity cache is updated immediately to reflect newly allocated beds.
9. **Operational Synthesis**: The NGO Dashboard Agent compiles the comprehensive operational payload with dispatch role tags and clinical reasoning.
10. **Live Dispatch & Command**: The FastAPI gateway broadcasts the incident via WebSockets (`/ws/dashboard`), immediately populating the Leaflet map and AI Action Plan panel for active responders.

---

## 📸 Screenshots

### Command Center
![GuardianAI Command Center](docs/screenshots/command-center.png)
*Centralized live operations overview featuring real-time KPI stat cards, an active incident feed, an interactive Leaflet emergency map of Hyderabad, and an AI Action Plan with hospital patient allocations, clinical reasoning justifications, and human-in-the-loop Approve/Override controls.*

---

### Victim Assistance
![GuardianAI Victim Assistance](docs/screenshots/victim-assistance.png)
*Citizen-facing conversational emergency assistance interface with multilingual text entry, hands-free voice dictation via Web Speech API, automated entity extraction, and instant localized reassurance with designated shelter locations.*

---

### Live Emergency Map
![GuardianAI Live Emergency Map](docs/screenshots/live-map.png)
*Full-screen geospatial intelligence dashboard rendering active disaster zones across Hyderabad with color-coded severity markers (Critical, High, Medium) and victim count cluster indicators.*

---

### Misinformation Monitor
![GuardianAI Misinformation Monitor](docs/screenshots/misinformation-monitor.png)
*Real-time rumor detection and fake news surveillance board displaying circulating social media claims, source attribution (WhatsApp Forwards, Twitter/X), AI confidence scores, and one-click Public Warning dispatch triggers.*

---

### Volunteer Coordination & Reports
![GuardianAI Volunteer Coordination](docs/screenshots/volunteer-coordination.png)
*Tabular incident reporting and field coordination console providing real-time disaster status logs, victim count metrics, AI confidence rankings, and one-click CSV report exports.*

---

## 🏗️ Architecture

![GuardianAI System Architecture](docs/architecture.png)

### Stage-by-Stage Architectural Breakdown

#### 1. Entry & Client Presentation Layer
Built with **React 19**, **TypeScript**, **Vite**, and **Leaflet**. The client layer provides dual specialized interfaces:
- **Victim Assistance Mobile Web App**: A lightweight, accessible conversational chat client featuring multilingual speech and text recognition, Web Speech API integration, and immediate shelter routing.
- **NGO & Responder Command Center**: A desktop-optimized operational workspace with dynamic role selection, real-time KPI metrics, interactive Leaflet mapping, expandable AI action plans, misinformation tracking, and volunteer management.

#### 2. API Gateway & Real-Time Communication Layer
Powered by **FastAPI** (`0.115.0`) and **Uvicorn**:
- **RESTful Endpoints**: Provides structured routes for victim message intake (`/api/victim`), responder role management and decision logging (`/api/responder`), hospital status querying (`/api/hospitals`), direct resource matching (`/api/resource`), and end-to-end pipeline execution (`/api/pipeline/run`).
- **WebSocket Broadcast Hub**: Implements an asynchronous `ConnectionManager` at `/ws/dashboard` maintaining persistent socket connections with active responder clients and broadcasting live incident updates.
- **Administrative Demo Controller**: Exposes `POST /api/admin/reset` to purge and recreate Qdrant vector collections and reset hospital capacity caches to baseline states for repeatable evaluations.

#### 3. LangGraph Multi-Agent Orchestration Engine
Built with **LangGraph** (`0.2.34`):
- Coordinates a sequential state machine (`StateGraph(PipelineState)`) managing four dedicated nodes: `intake` $\rightarrow$ `dedup` $\rightarrow$ `match` $\rightarrow$ `dashboard` $\rightarrow$ `END`.
- Preserves explicit typed state transitions across message extraction, vector deduplication, capacity-aware hospital matching, and responder payload formatting.

#### 4. Specialized Agent Pipeline
- **Victim Assistance Agent**: Communicates with **ChatGroq** (`llama-3.3-70b-versatile`) to extract need categories, urgency, and place names while providing empathetic citizen reassurance.
- **Emergency Intelligence Agent**: Employs **Ollama** (`nomic-embed-text`) to generate 768-dimensional embeddings and queries **Qdrant** for spatial-semantic deduplication and cluster confidence estimation.
- **Resource Finder Agent**: Executes deterministic Haversine distance computations and multi-factor hospital suitability algorithms to balance patient loads and decrement live capacity.
- **NGO Dashboard Agent**: Synthesizes agent context into human-readable action plans with clinical reasoning and resolves responder role dispatching.

#### 5. Data & Vector Persistence Layer
- **PostgreSQL Database**: Relational schema defined via **SQLAlchemy 2.0** and **AsyncPG** storing `incidents`, `reports`, `hospitals`, and `users`.
- **Qdrant Vector Database**: High-speed vector index storing 768-dimensional incident vectors with cosine distance matching for rapid real-time similarity clustering.
- **Simulation & Seed Fixtures**: Pre-configured datasets (`mock_hospitals.json`, `seed_victim_reports.json`) and automated playback scripts (`seed_demo.py`) simulating live multi-incident disaster scenarios.

---

## 🛠️ Tech Stack

| Layer | Technology | Details / Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** (`react`, `react-dom`) | Modern component-based user interface architecture |
| **Language & Build Tool** | **TypeScript** + **Vite 8** | Type-safe development with next-generation HMR bundler |
| **Geographic Mapping** | **Leaflet** (`leaflet`, `@types/leaflet`) | Interactive GIS mapping with custom HTML div markers and OpenStreetMap tiles |
| **Icons & Styling** | **Lucide React** + Custom CSS Tokens | Clean iconography and responsive CSS custom property theming |
| **HTTP Client** | **Axios** | Client-side API request handling |
| **Backend Framework** | **FastAPI** (`0.115.0`) + **Uvicorn** | High-performance asynchronous Python web framework |
| **Validation & Settings** | **Pydantic v2** (`pydantic-settings`) | Type-safe environment configuration and request schema validation |
| **Multi-Agent Orchestration** | **LangGraph** (`0.2.34`) + **LangChain** | Deterministic state machine workflow coordination |
| **LLM Inference** | **Groq Cloud** (`langchain-groq`) | Ultra-fast inference running `llama-3.3-70b-versatile` |
| **Text Embeddings** | **Ollama** (`ollama`) | Local inference serving 768-dim `nomic-embed-text` |
| **Vector Database** | **Qdrant** (`qdrant-client`) | High-dimensional vector similarity search and clustering |
| **Relational Database** | **PostgreSQL** (`asyncpg`, `psycopg2`) | Persistent storage for incidents, distress reports, and users |
| **ORM & Migrations** | **SQLAlchemy 2.0** + **Alembic** | Asynchronous ORM models and schema migrations |
| **Real-Time Layer** | **WebSockets** (`websockets`) | Bidirectional WebSocket server for real-time dashboard dispatch |
| **Testing & Quality** | **Pytest** + **Oxlint** | Asynchronous backend test suite and high-speed frontend linter |

---

## 📁 Project Structure

```text
Guardian-AI/
├── README.md                           # Comprehensive portfolio documentation
├── docker-compose.yml                  # Multi-container orchestration definition
├── package-lock.json                   # Root package lockfile
├── docs/                               # Project architectural and media assets
│   ├── architecture.png                # High-resolution system architecture diagram
│   ├── agent-contracts.md              # Inter-agent I/O schemas and role definitions
│   ├── demo-script.md                  # Demonstration script and scenario walkthrough
│   └── screenshots/                    # High-resolution application screenshots
│       ├── command-center.png          # Responder Command Center overview
│       ├── victim-assistance.png       # Multilingual citizen chat interface
│       ├── live-map.png                # Geospatial emergency map view
│       ├── misinformation-monitor.png  # Fake news and rumor detection board
│       └── volunteer-coordination.png  # Incident reports & CSV export console
│
├── backend/                            # FastAPI backend & LangGraph agent engine
│   ├── Dockerfile                      # Backend container build definition
│   ├── requirements.txt                # Locked Python backend dependencies
│   ├── create_tables.py                # Database table initialization script
│   ├── data/                           # Mock datasets and simulation fixtures
│   │   ├── mock_hospitals.json         # Hyderabad hospital capacity records
│   │   ├── seed_victim_reports.json    # 18 multilingual emergency test reports
│   │   └── demo_scenario.json          # Structured disaster scenario timeline
│   ├── scripts/                        # Operational and testing scripts
│   │   └── seed_demo.py                # Automated HTTP stream simulator
│   ├── tests/                          # Automated backend test suite
│   │   ├── test_emergency_intelligence.py
│   │   ├── test_ngo_dashboard.py
│   │   ├── test_pipeline.py            # End-to-end LangGraph pipeline test
│   │   ├── test_resource_finder.py     # Hospital allocation rules test
│   │   └── test_victim_assistance.py
│   └── app/                            # Application source code
│       ├── __init__.py
│       ├── config.py                   # Pydantic Settings & environment loader
│       ├── dependencies.py             # FastAPI dependency injections
│       ├── main.py                     # FastAPI app factory, CORS & router registration
│       ├── agents/                     # Specialized AI agent implementations
│       │   ├── victim_assistance/      # Intake, Groq prompt & multilingual reply
│       │   │   ├── agent.py
│       │   │   └── prompts.py
│       │   ├── emergency_intelligence/ # Embeddings, Qdrant vector dedup & clustering
│       │   │   ├── agent.py
│       │   │   └── embeddings.py
│       │   ├── resource_finder/        # Haversine distance, scoring & bed allocation
│       │   │   ├── agent.py
│       │   │   └── rules.py
│       │   └── ngo_dashboard/          # Operational synthesis & reasoning formatter
│       │       ├── agent.py
│       │       └── formatter.py
│       ├── db/                         # Database clients and connections
│       │   ├── postgres.py             # SQLAlchemy AsyncEngine & sessionmaker
│       │   └── qdrant_client.py        # Qdrant client & collection lifecycle
│       ├── models/                     # SQLAlchemy relational database models
│       │   ├── incident.py             # Incidents table schema
│       │   ├── report.py               # Raw victim reports table schema
│       │   ├── hospital.py             # Hospital facilities table schema
│       │   └── user.py                 # User & responder roles schema
│       ├── orchestration/              # LangGraph multi-agent workflow
│       │   └── graph.py                # StateGraph, PipelineState & node wiring
│       ├── routers/                    # FastAPI route controllers
│       │   ├── admin_routes.py         # POST /api/admin/reset endpoint
│       │   ├── hospitals_routes.py     # GET /api/hospitals endpoint
│       │   ├── incidents_routes.py     # GET /api/incidents endpoint
│       │   ├── pipeline_routes.py      # POST /api/pipeline/run endpoint
│       │   ├── resource_finder_routes.py# POST /api/resource/match endpoint
│       │   ├── responder_routes.py     # Roles & POST /api/responder/decision
│       │   ├── victim_routes.py        # POST /api/victim/message endpoint
│       │   └── websocket_routes.py     # WS /ws/dashboard connection manager
│       └── utils/                      # Helper utilities
│           ├── confidence.py           # Statistical confidence utilities
│           ├── language.py             # Language detection helpers
│           ├── locations.py            # Area name to coordinate gazetteer
│           ├── permissions.py          # Role-based feature matrix
│           └── routing.py              # Need type to responder agency mapping
│
└── frontend/                           # React 19 + TypeScript frontend application
    ├── index.html                      # Application entry HTML
    ├── package.json                    # Frontend dependencies & npm scripts
    ├── package-lock.json               # Locked frontend dependency tree
    ├── tsconfig.json                   # TypeScript configuration
    ├── tsconfig.app.json               # Vite app TypeScript rules
    ├── tsconfig.node.json              # Node environment TypeScript rules
    ├── vite.config.ts                  # Vite bundler & React plugin config
    ├── .oxlintrc.json                  # Oxlint linter configuration
    ├── public/                         # Static web assets
    │   ├── favicon.svg                 # GuardianAI browser icon
    │   └── icons.svg                   # SVG symbol definitions
    └── src/                            # Application source code
        ├── App.css                     # Global component layout styles
        ├── App.tsx                     # Mode switcher (Victim App vs. Responder Dashboard)
        ├── index.css                   # Global CSS resets & typography
        ├── main.tsx                    # React root mount point
        ├── router.tsx                  # Client-side routing definitions
        ├── assets/                     # Frontend logos and SVG graphics
        ├── styles/
        │   └── theme.css               # Design system color tokens & variables
        ├── shared/                     # Shared models, hooks, and UI primitives
        │   ├── incidentLabels.ts       # Human-readable incident type mapping
        │   ├── permissions.ts          # canView role permission evaluator
        │   ├── severity.ts             # Urgency color resolver
        │   ├── types.ts                # TypeScript interfaces (Incident, ActionPlan, etc.)
        │   ├── api/
        │   │   └── client.ts           # Axios API client (sendVictimMessage)
        │   ├── components/
        │   │   ├── Sidebar.tsx         # Navigation sidebar with AI agent status
        │   │   ├── StatCard.tsx        # KPI metric card component
        │   │   └── TopBar.tsx          # Responder profile & operational status bar
        │   └── hooks/
        │       ├── useApi.ts           # Data fetching custom hook
        │       └── useWebSocket.ts     # Persistent WebSocket connection hook
        ├── responder-dashboard/        # Responder Command Center views
        │   ├── CommandCenter.tsx       # Main dashboard layout & WebSocket listener
        │   ├── RoleSelectScreen.tsx    # Role selector (NGO, Fire, Medical, Police)
        │   └── panels/                 # Modular dashboard panel components
        │       ├── ActiveIncidents.tsx # Live incident list
        │       ├── AgentPipeline.tsx   # Visual multi-agent status indicator
        │       ├── AIActionPlan.tsx    # Hospital allocation & Approve/Override UI
        │       ├── AnalyticsOverview.tsx
        │       ├── AnalyticsView.tsx   # Category breakdown & confidence meters
        │       ├── FakeNewsView.tsx    # Misinformation monitor & warning triggers
        │       ├── HospitalStatus.tsx  # Live hospital ICU/bed capacity bars
        │       ├── LiveMap.tsx         # Leaflet interactive map with markers
        │       ├── ReportsView.tsx     # Incident reports table & CSV exporter
        │       ├── ResourcesView.tsx   # Shelters, water, food & charging directory
        │       ├── SettingsView.tsx    # Operational preferences & notifications
        │       └── VolunteersView.tsx  # Field volunteer roster & assignment
        └── user-app/                   # Victim-facing mobile web interface
            ├── ChatScreen.tsx          # Multilingual emergency intake chat
            ├── StatusScreen.tsx        # Report tracking view
            └── components/
                ├── MessageInput.tsx    # Input bar with send button
                ├── MicButton.tsx       # Web Speech API voice recording button
                └── ReportConfirmation.tsx # Reassurance confirmation card
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm 10+**
- **Ollama** installed locally with the `nomic-embed-text` embedding model pulled:
  ```bash
  ollama pull nomic-embed-text
  ```
- **Qdrant** vector database running locally or via Docker:
  ```bash
  docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
  ```
- **PostgreSQL 15+** instance (local or hosted)
- A **Groq API Key** for LLM inference (obtainable from [console.groq.com](https://console.groq.com))

---

### Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/ZavedDavdani/Guardian-AI.git
cd Guardian-AI
```

#### 2. Backend Setup
1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   ```

2. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure backend environment variables:
   Create a `.env` file inside the `backend/` directory:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/guardian_db
   QDRANT_HOST=localhost
   QDRANT_PORT=6333
   GROQ_API_KEY=gsk_your_groq_api_key_here
   OLLAMA_HOST=http://localhost:11434
   JWT_SECRET=super_secret_guardian_jwt_key_change_in_production
   JWT_ALGORITHM=HS256
   ```

5. Initialize database tables:
   ```bash
   python create_tables.py
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be accessible at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

---

#### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   Create a `.env` file inside the `frontend/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_WS_URL=ws://localhost:8000/ws/dashboard
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

#### 4. Running the Disaster Simulation Script
To simulate live incoming emergency distress reports from citizens across Hyderabad and observe real-time clustering, hospital decrements, and WebSocket broadcasts:

```bash
# In backend directory with virtual environment activated:
python scripts/seed_demo.py
```

---

#### 5. Running Automated Tests
```bash
# Run unit and pipeline verification tests
pytest backend/tests/
```

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Description | Requirement | Default / Example Placeholder |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy async PostgreSQL connection URI | **Required** | `postgresql+asyncpg://postgres:password@localhost:5432/guardian_db` |
| `QDRANT_HOST` | Hostname for the Qdrant vector database instance | **Required** | `localhost` |
| `QDRANT_PORT` | Port for Qdrant HTTP/REST API | Optional | `6333` |
| `GROQ_API_KEY` | Groq Cloud API key for running `llama-3.3-70b-versatile` | **Required** | `gsk_your_groq_api_key_placeholder` |
| `OLLAMA_HOST` | Endpoint for local Ollama embedding inference | Optional | `http://localhost:11434` |
| `JWT_SECRET` | Secret key used to sign and verify responder JWT tokens | **Required** | `your_secure_jwt_signing_secret` |
| `JWT_ALGORITHM` | Cryptographic algorithm for JWT encoding | Optional | `HS256` |

### Frontend Configuration (`frontend/.env`)

| Variable | Description | Requirement | Default / Example Placeholder |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for FastAPI backend REST endpoints | **Required** | `http://localhost:8000/api` |
| `VITE_WS_URL` | WebSocket endpoint for real-time dashboard events | **Required** | `ws://localhost:8000/ws/dashboard` |

> [!IMPORTANT]
> Never commit real production secrets, database credentials, or Groq API keys to version control. Use `.env.example` templates for collaboration.

---

## 🗄️ Data Layer

GuardianAI uses a hybrid persistence architecture combining relational storage, vector search, and in-memory capacity caching.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                   │
├────────────────────────────┬────────────────────────────┬────────────────┤
│   PostgreSQL (Relational)  │    Qdrant (Vector Store)   │ JSON Fixtures  │
├────────────────────────────┼────────────────────────────┼────────────────┤
│ • incidents (Clusters)     │ • Collection:              │ • mock_hospitals│
│ • reports (Raw intake)     │   guardian_incidents       │ • seed_reports │
│ • hospitals (Static info)  │ • Dimension: 768           │ • demo_scenario│
│ • users (Responder auth)   │ • Metric: Cosine           │                │
└────────────────────────────┴────────────────────────────┴────────────────┘
```

### Relational Schema (PostgreSQL)
- **`incidents`**: Stores consolidated emergency clusters (`id`, `type`, `area`, `latitude`, `longitude`, `victim_count`, `urgency`, `confidence`, `status`, `reasoning` JSON, `created_at`, `updated_at`).
- **`reports`**: Stores individual victim reports (`id`, `incident_id` FK, `raw_message`, `language`, `location_text`, `latitude`, `longitude`, `need_type`, `is_duplicate`, `created_at`).
- **`hospitals`**: Stores facility metadata (`id`, `name`, `area`, `latitude`, `longitude`, `total_beds`, `available_beds`, `icu_total`, `icu_available`, `specialists`).
- **`users`**: Stores user identities and access modes (`id`, `name`, `mode`, `role`).

### Vector Storage (Qdrant)
- **Collection Name**: `guardian_incidents` (with fallback to `victim_reports`).
- **Vector Specification**: 768-dimensional dense vectors generated by `nomic-embed-text`.
- **Distance Metric**: Cosine distance with a similarity threshold of $\ge 0.82$.
- **Payload Metadata**: `incident_id`, `location_text`, `need_type`, `cluster_size`, `timestamp`.

### Simulation Data Fixtures
- **`mock_hospitals.json`**: Pre-configured facility roster for 4 major Hyderabad healthcare institutions (Hospital A - Ameerpet, Hospital B - Secunderabad, Hospital C - Banjara Hills, Hospital D - Kukatpally) with detailed bed counts, ICU capacity, and specialist tags.
- **`seed_victim_reports.json`**: 18 multilingual distress messages representing diverse disaster situations (flooding, fires, rooftop strandings, chest pain, structural collapses).

---

## 🔌 API Reference

### Health & Core
| Endpoint | Method | Purpose | Payload / Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | Service liveness probe | None | `{"status": "ok"}` |

### Multi-Agent Pipeline & Victim
| Endpoint | Method | Purpose | Payload / Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/pipeline/run` | `POST` | Executes end-to-end LangGraph pipeline & broadcasts via WS | `{"message": str, "user_id": str}` | Final aggregated operational incident object |
| `/api/victim/message` | `POST` | Ingests victim message and returns localized reassurance | `{"message": str, "user_id": str}` | `{"victim_reply": str, "location_text": str, ...}` |

### Responder Operations & Logistics
| Endpoint | Method | Purpose | Payload / Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/responder/roles` | `GET` | Lists valid responder agency roles | None | `["ngo", "fire_brigade", "medical", "police", ...]` |
| `/api/responder/decision` | `POST` | Logs human-in-the-loop plan decision | `{"incident_id": str, "decision": "approved" | "overridden"}` | `{"status": "logged", "total_logged": int}` |
| `/api/hospitals/` | `GET` | Retrieves live hospital capacity snapshot | None | Array of hospital objects with live bed/ICU stats |
| `/api/resource/match` | `POST` | Executes isolated resource matching algorithm | `{"incident_id": str, "victim_count_estimate": int, "urgency": str, ...}` | `{"distribution_plan": [...], "reasoning": [...]}` |
| `/api/incidents/` | `GET` | Lists active emergency incidents | None | Array of incident records |

### Administrative & Demo Reset
| Endpoint | Method | Purpose | Payload / Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/admin/reset` | `POST` | Purges Qdrant vector collection & reloads hospital cache | None | `{"status": "reset complete"}` |

### Real-Time WebSocket
| Endpoint | Protocol | Purpose | Direction | Payload Example |
| :--- | :--- | :--- | :--- | :--- |
| `/ws/dashboard` | `WebSocket` | Real-time incident & action plan event broadcast | Server $\rightarrow$ Client | `{"type": "incident_update", "payload": { ... }}` |

---

## ⚡ Real-Time Operations

GuardianAI implements a real-time event pipeline using native WebSockets:

1. **Persistent Connection**: When a responder opens the Command Center, the frontend hook `useWebSocket` establishes a persistent connection to `/ws/dashboard`.
2. **Connection Heartbeat**: The client sends periodic keep-alive pings every 15 seconds to prevent timeout disconnections across firewalls and reverse proxies.
3. **Pipeline Broadcast**: Whenever a new emergency report is processed via `/api/pipeline/run`, the LangGraph orchestrator produces an aggregated action plan. The FastAPI router immediately invokes `manager.broadcast({"type": "incident_update", "payload": final})`.
4. **Reactive State Mutation**: The frontend listener catches the `incident_update` event, smoothly updating active incident lists, recalculating top-level KPI counters, repainting Leaflet map markers, and populating the AI Action Plan panel without full-page reloads.

---

## 🐳 Docker & Containerization

GuardianAI is container-ready. The backend includes a dedicated `Dockerfile` for containerized Python execution, and the architecture is designed to orchestrate the application alongside PostgreSQL and Qdrant via Docker Compose.

```yaml
# Conceptual Multi-Service Architecture
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/guardian_db
      - QDRANT_HOST=qdrant
      - GROQ_API_KEY=${GROQ_API_KEY}
    depends_on:
      - db
      - qdrant

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=guardian_db
      - POSTGRES_PASSWORD=postgres

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
```

> [!NOTE]
> For local development, running FastAPI directly with Uvicorn alongside local Qdrant and PostgreSQL provides the lowest-latency debugging loop for LLM prompts and Ollama embedding generation.

---

## 🛡️ Security & Responsible AI Use

Because GuardianAI addresses emergency response and humanitarian crisis workflows, safety, data protection, and operational reliability are foundational design considerations:

- **Prototype & Decision Support Scope**: GuardianAI is an engineering prototype and research system. AI outputs, hospital allocations, and incident clusters must never replace human judgement in life-or-death situations.
- **Human-in-the-Loop Safeguards**: The system enforces explicit **Approve Plan** and **Override** controls for emergency coordinators before dispatches are logged.
- **Data Privacy & PII Handling**: Distress reports contain sensitive location and medical details. In production environments, victim phone numbers and direct identifiers must be pseudonymized, and data in transit must be encrypted via TLS 1.3.
- **Auditing & Traceability**: All responder overrides and dispatch decisions are logged with timestamps to provide an immutable operational audit trail for post-incident review.
- **Graceful Degradation**: If vector databases or external LLMs become unreachable, the backend maintains fallback responses and local gazetteer coordinate lookups to prevent system deadlocks.

---

## ⚠️ Current Limitations

- **Simulated Demonstration Fixtures**: Hospital occupancy metrics and seed distress reports are derived from realistic mock data for Hyderabad rather than live government telemetry.
- **Gazetteer-Based Geocoding**: Coordinate resolution currently relies on a regional gazetteer lookup dictionary for Hyderabad localities rather than a live global geocoding service (e.g., Google Maps / Mapbox / OpenStreetMap Nominatim).
- **Prototype Authentication Gate**: The user and responder role selection is implemented as an in-memory client toggle for rapid demonstration rather than full OAuth2/SAML SSO authentication.
- **Local Ollama Dependency**: Semantic deduplication requires a running local Ollama instance with `nomic-embed-text` or a self-hosted embedding server.
- **No Direct CAD / Emergency Telephony Bridge**: The platform does not directly initiate PSTN phone calls, SMS broadcasts, or interface directly with national emergency dispatch lines (e.g., 112).

---

## 🔮 Future Improvements

- **Live CAD & 112 Integration**: Direct two-way synchronization with official Computer-Aided Dispatch (CAD) systems and national emergency response gateways.
- **Satellite & GIS Flood Modeling**: Ingestion of real-time satellite radar imagery (ISRO / Sentinel) and rainfall telemetry to overlay dynamic flood inundation polygons onto the Leaflet map.
- **HL7 / FHIR Hospital Capacity Sync**: Direct integration with regional hospital management information systems (HMIS) for live bed, ventilator, and blood bank availability.
- **Production RBAC & Audit Trails**: Hardened JWT/OAuth2 session authentication with multi-factor verification and cryptographic immutable logging.
- **Offline-First PWA & SMS Gateway**: Progressive Web App caching and two-way SMS emergency reporting for citizens in low-bandwidth or infrastructure-damaged disaster zones.
- **AI Voice Call-In Agent**: Real-time voice agent integration (via Twilio WebRTC / LiveKit) allowing victims to dial a single emergency number and speak naturally with the intake agent.

---

## 💡 Why GuardianAI?

GuardianAI demonstrates practical, high-impact AI systems engineering applied to disaster management:

- **LangGraph Multi-Agent State Machine**: Showcases how to move beyond simple chat interfaces into robust, deterministic multi-agent pipelines with explicit state transitions and typed contracts.
- **Hybrid Spatial-Semantic Clustering**: Combines 768-dimensional dense vector embeddings in Qdrant with geographic gazetteer mapping to solve the real-world duplicate report problem during emergencies.
- **Resource Optimization Algorithms**: Demonstrates domain-grounded mathematical optimization combining Haversine distance, ICU availability, clinical specialty weighting, and live inventory decrementing.
- **Real-Time Reactive Architecture**: Unifies asynchronous FastAPI backends with WebSocket dispatch and modern React 19 frontend state management for zero-latency situational awareness.
- **Social Impact AI**: Applies advanced LLM reasoning, multilingual NLP, and vector search to address critical humanitarian coordination challenges.

---

## 👥 Team

GuardianAI was designed and developed by a four-person collaborative engineering team:

- **Zaved Davdani** — [@ZavedDavdani](https://github.com/ZavedDavdani)
- **Aqif** — [@Aqifcodes](https://github.com/Aqifcodes)
- **Wasif** — [@wasifhaq434701-png](https://github.com/wasifhaq434701-png)
- **Samad** — [@AbdulSamad502](https://github.com/AbdulSamad502)

---

## 🔗 Project Links

- **GitHub Repository**: [https://github.com/ZavedDavdani/Guardian-AI](https://github.com/ZavedDavdani/Guardian-AI)
