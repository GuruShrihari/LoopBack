# LoopBack — A Different Approach to Job Hunting

**Note:** I intentionally did not deploy LoopBack as a public-facing application because I didn't want to present a half-baked product as a finished one. Instead, I containerized the entire application with Docker Compose so it can be set up and evaluated locally with minimal configuration. If you wanna know if i can deploy or not , you can check this repo out -[https://github.com/GuruShrihari/SnipUrl].

LoopBack was built as my approach to the given challenge of creating a **one-stop platform for the modern job seeker**.

The problem statement highlighted how fragmented the job-search process has become: job discovery, applications, professional profiles, interview experiences, communities, and referrals are often handled across different platforms.

However, the challenge wasn't simply to combine features from LinkedIn, Indeed, Glassdoor, or Naukri. The interesting part was:

> **What can I build that existing solutions don't do well?**

I approached this by focusing on the **connections between these different parts of the job-search process**.

LoopBack brings together **job discovery, applications, AI-assisted matching, employee referrals, company insights, community discussions, and recruiter workflows** in a single system.

While building it, I also used the project to explore backend concepts beyond basic CRUD—such as authentication, authorization, rate limiting, idempotency, external API failure handling, background processing, and event-driven design.

The result is a working prototype that tries to make the job-search journey more connected rather than simply recreating an existing job platform.

---

# What LoopBack Does

### Job Discovery & Applications

Candidates can browse available jobs, view their details, and apply directly through the platform.

### AI Resume Matching

Candidates can upload their resume and compare it against a specific job using Gemini.

The system provides:

* Match score
* Matching strengths
* Skill gaps
* Match summary
* Personalized referral pitch

If Gemini is unavailable, LoopBack falls back to a local keyword-based matching system so the feature remains usable.

### Verified Employee Referrals

Candidates can request referrals from employees at the company they are applying to.

Employed users can manage their referral capacity and review incoming requests.

One idea I particularly wanted to experiment with is the **referral flywheel**:

```text
Candidate
    ↓
Gets hired
    ↓
Becomes an employee
    ↓
Referral Hub unlocked
    ↓
Can help the next candidate
```

When an application reaches `OFFER_ACCEPTED`, the user's employment information is updated and the Referral Hub becomes available.

### Recruiter ATS

Recruiters can create jobs and manage candidates through a simple hiring pipeline:

```text
APPLIED → SCREENING → INTERVIEWING → OFFERED → OFFER_ACCEPTED
```

Job creation and candidate management are restricted based on the recruiter's relationship with the company.

### Company & Interview Insights

Users can share interview experiences, including:

* Interview rounds
* Difficulty
* Topics discussed
* Outcome
* Role-specific experiences

The goal is to give candidates useful information before they apply or interview.

### Anti-Ghosting

Each job can have a response timeframe.

A background sweep checks applications that have remained unanswered beyond that timeframe and can mark them as:

```text
GHOSTED
```

This information can then contribute to company-level metrics such as response time and ghosting rate.

---

# Some Backend Problems I Tried to Solve

One of the main reasons I built LoopBack was to experiment with backend problems beyond basic CRUD.

## Rate Limiting

The AI endpoint is more expensive than normal API requests, so I implemented a sliding-window rate limiter.

It tracks requests per user/IP and returns `429 Too Many Requests` when the limit is exceeded.

The API also exposes:

```text
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

For this prototype, the state is stored in memory.

---

## Idempotency

Network failures can cause clients to retry requests that the server may have already processed.

For mutating requests, LoopBack supports:

```text
Idempotency-Key
```

The response is cached for the key so that retrying the same request does not create duplicate database mutations.

---

## Circuit Breaker

Gemini is an external dependency, so I didn't want an API failure to bring down the AI workflow.

I implemented a simple:

```text
CLOSED → OPEN → HALF_OPEN
```

circuit breaker.

After repeated failures, the circuit opens and requests are routed directly to the local matching fallback.

---

## Event Bus

Important actions such as:

```text
job_created
offer_accepted
referral_requested
ai_match_executed
```

can be published through a small in-process event bus.

This keeps event handling separate from the main business logic and currently powers structured telemetry.

For a production-scale system, this could eventually be replaced with a durable message broker.

---

# Authorization

LoopBack has three main user types:

```text
Candidate
Recruiter
Employed Referrer
```

But permissions aren't based only on roles.

For example:

* A normal candidate cannot grant referrals.
* An employed candidate can access the Referral Hub.
* Recruiters can create jobs only for companies they belong to.
* Recruiters can manage candidates for their own jobs.

This led me to use a combination of **role-based and resource-level authorization**.

---

# AI Implementation

I used Google's Gemini API through the `google-genai` SDK.

Rather than asking the model for an arbitrary response, the AI service uses a structured JSON response format containing:

```text
match_score
match_summary
strengths
gaps
referral_pitch
```

This makes the output predictable for the frontend.

The AI workflow is also designed with failure in mind:

```text
                 ┌── Gemini ──► Structured Result
                 │
Resume + Job ────┤
                 │
                 └── Fallback ─► Local Matching
```

If the API key is missing or Gemini fails, the local matching engine can still provide a basic result.

---

# Architecture

```text
                  React + TypeScript
                         │
                         ▼
                 FastAPI API Layer
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    Rate Limiter    Idempotency    Circuit Breaker
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Business Services
                    /           \
                   ▼             ▼
             PostgreSQL      Event Bus
                                  │
                                  ▼
                              Telemetry
```

The backend is separated into routers, services, schemas, models, and core infrastructure so that business logic isn't tightly coupled to the API layer.

---

# Tech Stack

### Backend

* Python 3.11+
* FastAPI
* SQLModel / SQLAlchemy
* PostgreSQL
* Pydantic
* JWT Authentication
* bcrypt
* Google Gemini API
* PyPDF

### Frontend

* React
* TypeScript
* Vite
* Zustand
* Vanilla CSS
* Lucide React

### Testing & Infrastructure

* PyTest
* Docker
* Docker Compose

---

# Project Structure

```text
LoopBack/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   │   ├── circuit_breaker.py
│   │   │   ├── config.py
│   │   │   ├── db.py
│   │   │   ├── event_bus.py
│   │   │   ├── idempotency.py
│   │   │   ├── rate_limiter.py
│   │   │   ├── security.py
│   │   │   └── telemetry.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── scripts/
│   │   └── run_ghosting_sweep.py
│   ├── tests/
│   └── main.py
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── store/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# Key API Endpoints

### AI Matcher

```http
POST /ai/match
```

Accepts a resume and job posting and returns the AI-generated match result.

### Job Creation

```http
POST /jobs/
```

Recruiter-only endpoint for creating job postings.

Supports idempotency and rate-limit protection.

### Application Status

```http
PATCH /applications/{application_id}/status
```

Allows authorized recruiters to update application status.

When an application reaches:

```text
OFFER_ACCEPTED
```

the candidate's employment relationship is updated and the Referral Hub is unlocked.

---

# Testing

I wrote tests covering the main pieces of behaviour rather than only testing basic API responses.

Current test suite:

```text
14 passed in 1.22s
```

Tests currently cover:

* AI fallback behaviour
* Referral permissions
* Rate limiting
* Idempotency
* Circuit breaker states
* Event bus behaviour

---

# Ambitions & Future Direction

Due to the time constraints of the project and the limitations of the free-tier LLMs available to me, I wasn't able to bring all of my **ever-expanding ideas** for solving this problem into the current version of LoopBack.

There were several directions I wanted to explore but had to leave for later. Below are a few of the improvements I would pursue if I had more time and the necessary tools and resources.


### 1. Smarter Career Profiles & Job Matching

Build a complete candidate profile containing skills, projects, education, experience, and preferences. The existing AI matcher could evolve into a career assistant that recommends relevant jobs, identifies skill gaps, and helps tailor applications.

### 2. A Trusted Career Network

Expand the Referral Hub and community into a verified network of candidates, employees, recruiters, and professionals. Candidates could find referrals, discuss specific roles, share interview experiences, and get company insights without relying on scattered platforms or cold DMs.

### 3. Closing the Application Feedback Loop

Connect application outcomes, recruiter responsiveness, interview experiences, and candidate feedback. This could help candidates understand where they are struggling and use that information to improve their next application.

The larger goal is to turn:

```text
Discover → Apply → Wait
```

into:

```text
Discover → Prepare → Network → Apply → Interview → Learn → Improve
```

The goal isn't to build another LinkedIn, Indeed, or Glassdoor.

It's to make the different parts of the job-search process **work together**.

I don't want to make this README unnecessarily long and boring by listing every idea I have for LoopBack. But if you're interested in hearing about the other improvements and features I have in mind, feel free to reach out I'd be happy to put together a list and share it :D

---

# What I Learned

The biggest thing I took away from LoopBack was that building a backend is not just about making endpoints work.

While building this project, I had to think about questions like:

**What happens if a request is retried?**

→ Idempotency.

**What happens if an external API goes down?**

→ Circuit breaker + fallback.

**What happens when an expensive endpoint is abused?**

→ Rate limiting.

**Who is actually allowed to perform an action?**

→ Role and resource-based authorization.

**What happens when an important business event occurs?**

→ Domain events.

These problems were probably more valuable to me than any individual feature, because they made me think about how the system behaves outside the happy path.

---

# Running Locally

### Prerequisites

* Python 3.11+
* Node.js 18+
* Docker & Docker Compose *(optional)*

### Using Docker

```bash
git clone https://github.com/YourUsername/LoopBack.git

cd LoopBack

cp .env.example .env

docker compose up --build
```

The application will be available at:

```text
Frontend  → http://localhost:5173
Backend   → http://localhost:8000
Swagger   → http://localhost:8000/docs
```

Gemini is optional. If no API key is provided, the local matching engine is used.

---

# Demo Accounts

The application automatically seeds demo accounts for evaluation.

| Role              | Email                    | Password      |
| ----------------- | ------------------------ | ------------- |
| Candidate         | `candidate@loopback.com` | `password123` |
| Recruiter         | `recruiter@loopback.com` | `password123` |
| Employed Referrer | `referrer@loopback.com`  | `password123` |

These accounts allow the different candidate, recruiter, and referral workflows to be explored without additional setup.

---

# License

This project is licensed under the MIT License.
