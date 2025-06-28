import structlog
import logging
from datetime import datetime
from typing import Any, Dict, Optional

# Configuration du logging structuré
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

# Création du logger
logger = structlog.get_logger()

def log_api_call(
    endpoint: str,
    method: str,
    status_code: int,
    user_id: Optional[str] = None,
    duration_ms: Optional[float] = None,
    error: Optional[Exception] = None
) -> None:
    """Log un appel API avec des informations structurées.
    
    Args:
        endpoint (str): Le point de terminaison de l'API appelé
        method (str): La méthode HTTP utilisée (GET, POST, etc.)
        status_code (int): Le code de statut HTTP de la réponse
        user_id (Optional[str]): L'ID de l'utilisateur qui fait l'appel
        duration_ms (Optional[float]): La durée de l'appel en millisecondes
        error (Optional[Exception]): L'erreur survenue pendant l'appel, le cas échéant
    
    Example:
        >>> log_api_call(
        ...     endpoint="/api/users",
        ...     method="GET",
        ...     status_code=200,
        ...     user_id="123",
        ...     duration_ms=150.5
        ... )
    """
    log_data: Dict[str, Any] = {
        "event": "api_call",
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
    }
    
    if user_id:
        log_data["user_id"] = user_id
    
    if duration_ms is not None:
        log_data["duration_ms"] = duration_ms
    
    if error:
        log_data["error"] = str(error)
        log_data["error_type"] = type(error).__name__
        logger.error("api_call_error", **log_data)
    else:
        logger.info("api_call", **log_data)

def log_audit_event(
    event_type: str,
    audit_id: str,
    client_id: str,
    expert_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Log un événement lié à un audit.
    
    Args:
        event_type (str): Le type d'événement (création, mise à jour, etc.)
        audit_id (str): L'ID de l'audit concerné
        client_id (str): L'ID du client concerné
        expert_id (Optional[str]): L'ID de l'expert concerné
        details (Optional[Dict[str, Any]]): Détails supplémentaires sur l'événement
    
    Example:
        >>> log_audit_event(
        ...     event_type="creation",
        ...     audit_id="audit_123",
        ...     client_id="client_456",
        ...     expert_id="expert_789",
        ...     details={"type": "TICPE"}
        ... )
    """
    log_data: Dict[str, Any] = {
        "event": "audit_event",
        "event_type": event_type,
        "audit_id": audit_id,
        "client_id": client_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if expert_id:
        log_data["expert_id"] = expert_id
    
    if details:
        log_data["details"] = details
    
    logger.info("audit_event", **log_data)

def log_simulation_event(
    event_type: str,
    simulation_id: str,
    client_id: str,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Log un événement lié à une simulation.
    
    Args:
        event_type (str): Le type d'événement (création, mise à jour, etc.)
        simulation_id (str): L'ID de la simulation concernée
        client_id (str): L'ID du client concerné
        details (Optional[Dict[str, Any]]): Détails supplémentaires sur l'événement
    
    Example:
        >>> log_simulation_event(
        ...     event_type="creation",
        ...     simulation_id="sim_123",
        ...     client_id="client_456",
        ...     details={"type": "TICPE"}
        ... )
    """
    log_data: Dict[str, Any] = {
        "event": "simulation_event",
        "event_type": event_type,
        "simulation_id": simulation_id,
        "client_id": client_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if details:
        log_data["details"] = details
    
    logger.info("simulation_event", **log_data)

def log_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """Log une erreur avec son contexte.
    
    Args:
        error (Exception): L'erreur à logger
        context (Optional[Dict[str, Any]]): Contexte supplémentaire sur l'erreur
    
    Example:
        >>> try:
        ...     # code qui peut lever une exception
        ...     raise ValueError("Invalid input")
        ... except Exception as e:
        ...     log_error(e, {"user_id": "123", "action": "update_profile"})
    """
    log_data: Dict[str, Any] = {
        "event": "error",
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if context:
        log_data["context"] = context
    
    logger.error("application_error", **log_data) 