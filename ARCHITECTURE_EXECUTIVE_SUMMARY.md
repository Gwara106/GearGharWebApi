# Executive Summary

**GearGhar** is a full-stack motorcycle parts e-commerce platform integrated with an AI-powered assistant that helps riders find compatible parts, diagnose mechanical issues, and access maintenance guidance. The system bridges the gap between a product catalog and technical fitment data, enabling data-driven part recommendations rather than LLM-invented suggestions.

## Purpose
The platform addresses two fundamental problems in motorcycle parts shopping: (1) riders cannot easily determine whether a part fits their specific motorcycle, and (2) general-purpose LLMs hallucinate product details, prices, and fitment claims without grounding in verified data. GearGhar solves this by making MongoDB the source of truth for all product, compatibility, and knowledge information, with the Gemini API only permitted to rephrase facts already retrieved from the database.

## Primary Business Domain
Motorcycle aftermarket parts retail with AI-assisted shopping. The domain encompasses product catalog management, motorcycle fitment verification, maintenance advice, repair diagnostics, and beginner education. The system serves both casual riders seeking part recommendations and experienced mechanics looking for diagnostic guidance.

## Major User-Facing Features
- **AI Chat Assistant**: A floating widget enabling natural-language queries about parts, fitment, maintenance, and repairs. The assistant remembers the user's motorcycle via a persistent garage model.
- **Product Catalog**: Searchable and filterable storefront with faceting by brand, category, price, fitment, and beginner-friendliness. Supports personalised re-ranking based on the user's garage and order history.
- **Fitment Verification**: Four-valued verdict system (FITS, FITS_UNIVERSAL, NO_FIT, UNKNOWN) that explicitly states whether a part fits a user's motorcycle, with never-a-guess semantics.
- **Maintenance Knowledge Base**: Curated service intervals, repair diagnostics, and beginner glossary entries, all sourced from MongoDB documents with traceable origins.
- **User Garage**: Persistent motorcycle profile storage odometer tracking, and personalisation across sessions.
- **Order Management**: Complete order lifecycle from creation to delivery with status history.

## Technology Stack
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS v3, shadcn-ui components (Radix UI primitives), lucide-react icons, TanStack React Query for server-state management
- **Backend**: Next.js API routes + Express, Mongoose ODM on MongoDB
- **Database**: MongoDB with rich schema models and specialised indexes (text, compound, unique, sparse)
- **AI**: Google Gemini via REST API with structured grounding schemas and server-side verification; falls back to deterministic template replies when Gemini is unavailable or fails verification
- **Authentication**: JWT access tokens stored in HTTP-only cookies, bcrypt password hashing, role-based access (user/admin)
- **State Management**: React Query for server data, AuthContext for user session, CartContext for shopping cart
- **External APIs**: AWS S3 for product images (via remotePatterns in next.config.mjs), Google Gemini AI

## Core Architectural Philosophy
Retrieval-Augmented Generation (RAG) is the central design pattern. The system always retrieves facts from MongoDB first, then grounds the LLM output against those retrieved facts via a structured JSON schema and server-side verification. Every factual claim in a generated reply must be traceable to a specific document ID or knowledge ref. Violations are recorded in a GroundingViolation collection, turning the anti-hallucination claim into a measurable rate (violating turns / total turns). The deterministic fallback — built entirely from retrieved documents — ensures safety-critical advice is never model-invented.

## Data Persistence
Nine MongoDB collections store the system state: users, motorcycles, products, productcompatibilities, orders, chatconversations, chatfeedbacks, chatanalyticsevents, and groundingviolations. Relationships are enforced through ObjectId references and application-level logic. The compatibility module implements a closed-world inference strategy: NO_FIT is only asserted when the catalogue demonstrably knows about fitment for that part category on that bike but this specific product is not linked.

## Thesis Relevance
The project provides a complete, running implementation of grounded AI for a specialised domain, with measurable hallucination metrics, deterministic fallback behaviour, and a full conversation analytics pipeline. The separation of retrieval and generation layers, the four-valued fitment verdict system, and the violation-tracking infrastructure make this a rich case study for AI system architecture, knowledge-grounded generation, and evaluation frameworks.