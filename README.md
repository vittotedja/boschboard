# BoschBoard

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3DBE41?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

Boschboard is an intelligent web application designed to predict when to calibrate industrial machinery, optimizing the calibration schedule to minimize costs. This tool leverages advanced machine learning techniques and OpenAI's language models to provide actionable insights, making the calibration process more efficient and cost-effective.
**Hackathon Submission** for [Deep Learning Week](https://www.dlweek.com/) by Team Strawberry

[![Live Demo](https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](boschboard-liart.vercel.app)

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| ⏱️ Predictive Calibration | Machine learning models predict optimal calibration timing before critical thresholds |
| 💰 Cost Optimization | AI-driven scheduling reduces maintenance costs by 30%+ |
| 🧠 Reinforcement Learning | Adaptive learning from historical maintenance data |
| 📈 ARIMA Forecasting | Accurate time-series predictions for equipment condition monitoring |
| 💬 RAG Assistant | AI-powered Q&A system for technical documentation |

## 👥 Meet the Team

| Member                    | GitHub                           |
|--------------------------|----------------------------------|
| Vitto Surya Tedja       | [@vittotedja](https://github.com/vittotedja) |
| Emily Aurelia           | [@emilyaurelia](https://github.com/emilyaurelia) |
| Alexander Vincent Lewi  | [@vincentlewi](https://github.com/vincentlewi) |
| Yozafard Harold         | [@yozafard](https://github.com/yozafard) |
| Dennis Hardianto        | [@dennish18](https://github.com/dennish18) |

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)

### Backend
- **ML Framework**: PyTorch
- **Time Series**: statsmodels (ARIMA)
- **API**: FastAPI

## 🚀 Getting Started

### Prerequisites

- Node.js ≥18.x
- Python 3.10+
- OpenAI API key

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/rexroth-calibration-assistant.git
```

2. **Install Dependencies**

```
# Frontend
npm install
```

3. **Environment Setup**

```
# Add your .env in root directory
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. **Running the App**
```
npm run dev
```