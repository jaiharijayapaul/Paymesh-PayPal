import json
from decimal import Decimal
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User, UserPreference
from app.models.provider import Provider
from app.core.security import hash_password

DEMO_PROVIDERS = [
    # Logo Design
    {
        "name": "NovaStudio Branding",
        "tagline": "Modern Minimalist & Tech Brand Identity Specialists",
        "description": "Award-winning studio with 8+ years crafting venture-backed startup identities, vector marks, complete brand style guides, and typography systems.",
        "category": "logo_design",
        "avatar_url": "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.92"),
        "review_count": 142,
        "starting_price": Decimal("110.00"),
        "minimum_price": Decimal("85.00"),
        "currency": "USD",
        "delivery_days": 3,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["Vector Illustration", "Brand Guidelines", "Figma", "Adobe Illustrator", "Color Theory"]),
        "portfolio_samples": json.dumps(["Fintech Logo Kit", "AI SaaS Mascot", "Cybersecurity Geometric Mark"])
    },
    {
        "name": "Apex Identity Labs",
        "tagline": "Rapid 3D & Vector Startup Brand Marks",
        "description": "We specialize in rapid, high-impact brand symbols and emblem design for fast-moving founders.",
        "category": "logo_design",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.78"),
        "review_count": 98,
        "starting_price": Decimal("95.00"),
        "minimum_price": Decimal("75.00"),
        "currency": "USD",
        "delivery_days": 2,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["Figma", "SVG Mastery", "App Icons"]),
        "portfolio_samples": json.dumps(["HealthTech App Icon", "DeFi Exchange Emblem"])
    },
    # Web Development
    {
        "name": "ByteCraft Engineering",
        "tagline": "Full-Stack React, Vite & Tailwind Web Applications",
        "description": "Production-grade frontend and fullstack web experiences built with speed, accessibility, and modern performance best practices.",
        "category": "web_development",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.95"),
        "review_count": 87,
        "starting_price": Decimal("220.00"),
        "minimum_price": Decimal("180.00"),
        "currency": "USD",
        "delivery_days": 5,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["React", "TypeScript", "Tailwind CSS", "Next.js", "REST APIs"]),
        "portfolio_samples": json.dumps(["SaaS Marketing Landing", "Realtime Crypto Dashboard", "Documentation Portal"])
    },
    {
        "name": "HyperLaunch Studios",
        "tagline": "High-Converting Responsive SaaS Landing Pages",
        "description": "Speedy implementation of responsive marketing web pages engineered for maximum conversion and SEO optimization.",
        "category": "web_development",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.80"),
        "review_count": 64,
        "starting_price": Decimal("160.00"),
        "minimum_price": Decimal("130.00"),
        "currency": "USD",
        "delivery_days": 4,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["HTML5", "CSS3", "JavaScript", "Responsive Design"]),
        "portfolio_samples": json.dumps(["Mobile-First Landing Page", "Waitlist Capture Site"])
    },
    # Video Editing
    {
        "name": "Kinetic Visuals",
        "tagline": "High-Paced Tech Reels & Product Walkthrough Videos",
        "description": "Engaging video edits with custom sound design, motion graphics overlays, subtitles, and color grading tuned for social algorithms.",
        "category": "video_editing",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.88"),
        "review_count": 73,
        "starting_price": Decimal("120.00"),
        "minimum_price": Decimal("90.00"),
        "currency": "USD",
        "delivery_days": 2,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["Premiere Pro", "After Effects", "Sound Mixing", "Color Grading"]),
        "portfolio_samples": json.dumps(["SaaS Promo Reel", "Product Feature Walkthrough", "Keynote Highlight Clip"])
    },
    # AI Automation
    {
        "name": "CognitiveFlow Labs",
        "tagline": "Autonomous AI Agent Workflows & Webhooks Integration",
        "description": "Designing end-to-end autonomous business workflows connecting LLMs, LangChain, n8n, Supabase, and automated CRM pipelines.",
        "category": "ai_automation",
        "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.97"),
        "review_count": 52,
        "starting_price": Decimal("250.00"),
        "minimum_price": Decimal("190.00"),
        "currency": "USD",
        "delivery_days": 4,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["LangChain", "FastAPI", "OpenAI / Claude API", "n8n", "Vector DBs"]),
        "portfolio_samples": json.dumps(["Automated Lead Ingestion Agent", "Customer Support Bot Engine"])
    },
    # Presentation Design
    {
        "name": "PitchPerfect Slide Co.",
        "tagline": "Series A/B Investor Pitch Decks & Keynotes",
        "description": "Transforming complex business models and data into beautiful, investor-ready presentation decks that close funding.",
        "category": "presentation_design",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.85"),
        "review_count": 110,
        "starting_price": Decimal("130.00"),
        "minimum_price": Decimal("95.00"),
        "currency": "USD",
        "delivery_days": 3,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["Pitch Decks", "PowerPoint", "Keynote", "Financial Charting"]),
        "portfolio_samples": json.dumps(["15-Slide Seed Round Deck", "Product Launch Keynote Deck"])
    },
    # Content Writing
    {
        "name": "Syntax & Ink Copywriting",
        "tagline": "Technical Writing, Whitepapers & B2B SaaS Articles",
        "description": "Engaging, developer-friendly copy, SEO-optimized technical blog posts, and insightful API documentation summaries.",
        "category": "content_writing",
        "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        "rating": Decimal("4.79"),
        "review_count": 65,
        "starting_price": Decimal("90.00"),
        "minimum_price": Decimal("70.00"),
        "currency": "USD",
        "delivery_days": 2,
        "is_available": True,
        "is_verified": True,
        "skills": json.dumps(["SEO Copywriting", "Technical Documentation", "Case Studies"]),
        "portfolio_samples": json.dumps(["Developer Guide Article", "Enterprise Case Study"])
    }
]


def seed_database():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed or update demo user
        demo_user = db.query(User).filter(User.email == "demo@paymesh.ai").first()
        if not demo_user:
            print("Seeding demo user: demo@paymesh.ai...")
            demo_user = User(
                email="demo@paymesh.ai",
                hashed_password=hash_password("password123"),
                full_name="Alex Mercer"
            )
            db.add(demo_user)
            db.flush()

            pref = UserPreference(
                user_id=demo_user.id,
                preferred_currency="USD",
                max_transaction_amount=Decimal("500.00"),
                min_provider_rating=Decimal("4.50"),
                preferred_delivery_days=3,
                mandatory_payment_approval=True
            )
            db.add(pref)
            db.commit()
            print("Demo user created.")

        # 2. Seed providers
        print("Checking providers...")
        for p_data in DEMO_PROVIDERS:
            existing = db.query(Provider).filter(Provider.name == p_data["name"]).first()
            if not existing:
                provider = Provider(**p_data)
                db.add(provider)
                print(f"Added provider: {p_data['name']} ({p_data['category']})")
        
        db.commit()
        print("Database seed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
