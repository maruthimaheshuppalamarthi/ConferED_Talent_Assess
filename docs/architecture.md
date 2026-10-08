# Enterprise AI Assessment Platform - Architecture & Security Guide

## 1. System Overview
NexusAssess is an enterprise-grade AI-powered online assessment platform designed for high-stakes technical hiring, coding challenges, essay evaluations, and automated proctoring.

```
+-----------------------------------------------------------------------+
|                             USER CLIENT                               |
| (Candidate Lockdown Browser / Recruiter Dashboard / Admin Portal)     |
+-----------------------------------------------------------------------+
                                   |
                         WebSockets / REST HTTP
                                   v
+-----------------------------------------------------------------------+
|                            FASTAPI BACKEND                            |
|  - Auth & OTP Engine      - Proctoring Event Hub      - DB Service    |
+-----------------------------------------------------------------------+
               |                                       |
               v                                       v
+-----------------------------+        +--------------------------------+
|   DOCKER SANDBOX RUNNER     |        |   SUPABASE POSTGRESQL DATABASE  |
|  - Isolated Code Exec       |        |   - Users & Roles              |
|  - Resource Limits (CPU/RAM)|        |   - Questions & Test Cases     |
+-----------------------------+        |   - Proctoring Logs & Results  |
                                       +--------------------------------+
```

---

## 2. Mandatory Candidate Score Masking Compliance
In strict compliance with business rules:
- Candidates are presented with an OTP verification step, hardware pre-flight diagnostics, and a secure lockdown assessment interface.
- Upon exam completion, candidates are presented **only** with a secure confirmation receipt (`Reference Submission ID`).
- Candidate UI components **never** expose scores, percentages, pass/fail status, section breakdowns, or recruiter notes. All scoring data is restricted to Recruiter & Admin roles.

---

## 3. Proctoring Engine Architecture
- **WebRTC Camera & Audio Analysis**: Continuously monitors face visibility, gaze shift, audio levels, and tab switching.
- **Violation Counter & Auto-Termination**: Automatically tracks violations against configurable limits defined in the Admin Portal with zero hardcoded business logic.
- **Live Proctoring Command Center**: Streams real-time candidate camera feeds and violation alerts to administrators via WebSockets.
