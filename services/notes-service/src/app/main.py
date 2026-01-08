from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.app.bootstrap import bootstrap_dependencies


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Notes API",
        description="Notes service following Clean Architecture",
        version="1.0.0"
    )
    
    # CORS middleware (adjust for production)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5101"],  # Vue dev server
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Bootstrap dependencies
    dependencies = bootstrap_dependencies()
    
    # Register routers
    app.include_router(dependencies['notes_router'])
    app.include_router(dependencies['auth_router'])
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok"}
    
    return app


# Create app instance
app = create_app()