# 🌆 Zonify

**Zonify** is an AI-powered co-design platform that bridges the gap between informal community ideas and structured urban planning. By leveraging the **Google Maps Platform** and **Gemini AI**, it transforms unstructured community input into data-driven, visually rendered architectural proposals.

---

## 🏗️ 1. Technical Architecture

Zonify operates on a modular three-tier architecture designed to move ideas from "thought" to "draft" with high spatial accuracy.



### 1.1 Interaction Layer (Frontend)
Built for accessibility, allowing non-technical users to engage with formal planning tools.
* **Platform:** Google Maps JavaScript API.
* **Integrations:** Google Places API (Context) and Google Static Maps API (Visuals).
* **Capabilities:** Real-world location selection, Street View immersion, and guided idea submission.

### 1.2 Intelligence Layer (AI)
The "Reasoning Engine" that structures unstructured human creativity.
* **AI Chat (Gemini 2.5 Flash):** Acts as the **Urban Planning Auditor**. It handles requirement extraction, feasibility triage, and analytical reasoning.
* **AI Vision (Gemini 2.0 Flash Experimental):** Generates architectural simulations and visual concept renderings by blending user text with satellite and Street View imagery.

### 1.3 Data & Collaboration Layer
Powered by **Firebase** for real-time synchronization and secure data integrity.
* **Cloud Firestore:** Real-time storage for map pins, proposals, and version history.
* **Firebase Authentication:** Role-based access and identity management.
* **Persistence Strategy:** Validated "pitches" utilize Base64 data URLs stored directly in Firestore for atomic, single-write database operations.

---

## 🛠️ 2. Key Implementation Details

### 2.1 The "Urban Planning Auditor"
Zonify uses a stateful chat session to evaluate proposals against a **9-Factor Scoring Rubric**. Proposals are classified into three states: `DRAFT`, `REJECTED`, or `VALIDATED` (Score $\ge 75/100$).

| Factor | Description |
| :--- | :--- |
| **Urban Fit** | Alignment with neighborhood context. |
| **Sustainability** | Environmental and SDG 11 impact. |
| **Safety & Access** | ADA compliance and pedestrian safety. |
| **Market Viability** | Economic feasibility and demand. |



### 2.2 Adaptive Resilience Profile (Deep Scan)
The system performs a 10km "Deep Scan" using the **Google Places API** and the **Haversine formula** to analyze the existing urban fabric:
$$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
This data is injected into Gemini to generate a "Three Pillars Analysis": Planning Feasibility, AI Site Audit, and Suitable Facilities.

### 2.3 Reporting Engine
Custom PDF generation via **jsPDF** uses vector-based construction (not screenshots) to produce professional reports. These are stored on the server's local filesystem with links indexed in Firestore.

---

## ⚖️ 3. Challenges & Mitigations

### 3.1 Structured Output Consistency
* **Problem:** Inconsistent JSON formatting from LLM responses during early testing.
* **Solution:** Implemented **Standardized System Prompts** and **Backend Validation Checks** to enforce strict JSON schemas for dashboard visualization.

### 3.2 Advisory Scope & Ethics
* **Risk:** Users might interpret AI output as legal or regulatory approval.
* **Solution:** Strict prompt engineering to maintain an **advisory tone**. Every output is explicitly labeled as a preliminary concept, reinforcing the role of professional planners.

---

## 🚀 4. Future Roadmap

### 🏁 Short-Term: Immersive Visualization
* **Lightweight Layout Editor:** Drag-and-drop benches, lighting, and greenery.
* **Live 3D Viewport:** Transition from Base64 images to **Three.js** or **Spline** digital twins.
* **AR Mobile Companion:** Overlay AI-generated visions onto the real world via phone cameras.

### 🗺️ Mid-Term: Participatory Governance
* **Civic Reputation System:** Reward high-quality contributors with weighted influence.
* **"Fund this Vision":** Direct integration with crowdfunding and micro-financing.
* **Squad Mode:** Real-time collaborative co-design sessions.

### 🌍 Long-Term: The Policy Bridge
* **IoT Integration:** Live traffic, air quality, and noise data impacting the Resilience Score.
* **Zoning Law API:** Automated checks for setbacks, height limits, and density violations.
* **Global Engine:** Localizing architectural styles (e.g., Brutalist vs. Vernacular) based on geographic coordinates.

---

**Zonify** transforms the "Not In My Backyard" (NIMBY) sentiment into "Yes, And..." (YIMBY) collaboration. 

> *Disclaimer: Zonify is a decision-support tool, not a professional certification system.*

## Getting Started
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
