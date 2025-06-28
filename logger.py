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
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    if user_id:
        log_data["user_id"] = user_id
    if duration_ms:
        log_data["duration_ms"] = duration_ms
    if error:
        log_data["error"] = str(error)
        log_data["error_type"] = type(error).__name__
    
    logger.info(**log_data)

def log_audit_event(
    event_type: str,
    audit_id: str,
    client_id: str,
    expert_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Log un événement lié à un audit.
    
    Args:
        event_type (str): Le type d'événement (ex: "audit_created", "audit_updated")
        audit_id (str): L'identifiant de l'audit
        client_id (str): L'identifiant du client
        expert_id (Optional[str]): L'identifiant de l'expert, si applicable
        details (Optional[Dict[str, Any]]): Détails supplémentaires de l'événement
    
    Example:
        >>> log_audit_event(
        ...     event_type="audit_updated",
        ...     audit_id="audit_123",
        ...     client_id="client_456",
        ...     expert_id="expert_789",
        ...     details={
        ...         "previous_status": "en_cours",
        ...         "new_status": "terminé"
        ...     }
        ... )
    """
    log_data: Dict[str, Any] = {
        "event": "audit_event",
        "event_type": event_type,
        "audit_id": audit_id,
        "client_id": client_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    if expert_id:
        log_data["expert_id"] = expert_id
    if details:
        log_data.update(details)
    
    logger.info(**log_data)

def log_simulation_event(
    event_type: str,
    simulation_id: str,
    client_id: str,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """Log un événement lié à une simulation.
    
    Args:
        event_type (str): Le type d'événement (ex: "simulation_created", "simulation_completed")
        simulation_id (str): L'identifiant de la simulation
        client_id (str): L'identifiant du client
        details (Optional[Dict[str, Any]]): Détails supplémentaires de l'événement
    
    Example:
        >>> log_simulation_event(
        ...     event_type="simulation_created",
        ...     simulation_id="sim_123",
        ...     client_id="client_456",
        ...     details={
        ...         "answers_count": 10,
        ...         "simulation_type": "TICPE"
        ...     }
        ... )
    """
    log_data: Dict[str, Any] = {
        "event": "simulation_event",
        "event_type": event_type,
        "simulation_id": simulation_id,
        "client_id": client_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    if details:
        log_data.update(details)
    
    logger.info(**log_data)

def log_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """Log une erreur avec contexte.
    
    Args:
        error (Exception): L'erreur à logger
        context (Optional[Dict[str, Any]]): Contexte supplémentaire de l'erreur
    
    Example:
        >>> try:
        ...     # Code qui peut lever une exception
        ...     raise ValueError("Une erreur")
        ... except Exception as e:
        ...     log_error(e, context={
        ...         "user_id": "user_123",
        ...         "action": "create_audit"
        ...     })
    """
    log_data: Dict[str, Any] = {
        "event": "error",
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    if context:
        log_data.update(context)
    
    logger.error(**log_data)

log_audit_event(
    event_type="audit_updated",
    audit_id="audit_123",
    client_id="client_456",
    expert_id="expert_789",
    details={
        "previous_status": "en_cours",
        "new_status": "terminé"
    }
)

log_simulation_event(
    event_type="simulation_created",
    simulation_id="sim_123",
    client_id="client_456",
    details={
        "answers_count": 10,
        "simulation_type": "TICPE"
    }
)

log_api_call(
    endpoint="/api/users",
    method="GET",
    status_code=200,
    user_id="123",
    duration_ms=150.5
) 