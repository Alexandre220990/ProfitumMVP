from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class BaseTimeStampModel(BaseModel):
    """Modèle de base avec timestamps"""
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class Client(BaseTimeStampModel):
    id: Optional[UUID] = None
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    company: str
    phone: str = Field(pattern=r'^\+?[0-9]{10,15}$')
    revenuAnnuel: float = Field(ge=0)
    secteurActivite: str
    nombreEmployes: int = Field(ge=0)
    ancienneteEntreprise: int = Field(ge=0)
    besoinFinancement: float = Field(ge=0)
    typeProjet: str
    dateSimulation: datetime
    formeJuridique: str
    regimeFiscal: str
    situationFinanciere: str

    @field_validator('situationFinanciere')
    def validate_situation(cls, v):
        allowed = ['active', 'inactive', 'en_attente']
        if v not in allowed:
            raise ValueError(f'Situation must be one of {allowed}')
        return v

class Expert(BaseTimeStampModel):
    id: Optional[UUID] = None
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    company: str
    siren: str = Field(pattern=r'^[0-9]{9}$')
    specializations: List[str]
    experience: str
    location: str
    rating: float = Field(ge=0, le=5)
    compensation: float = Field(ge=0)
    description: str
    status: str
    disponibilites: Dict[str, Any]
    certifications: Dict[str, Any]
    abonnement: str

    @field_validator('status')
    def validate_status(cls, v):
        allowed = ['actif', 'inactif', 'suspendu']
        if v not in allowed:
            raise ValueError(f'Status must be one of {allowed}')
        return v

class Audit(BaseTimeStampModel):
    id: Optional[UUID] = None
    clientId: UUID
    expertId: UUID
    audit_type: str
    status: str
    current_step: int = Field(ge=0)
    progress: int = Field(ge=0, le=100)
    potential_gain: float = Field(ge=0)
    obtained_gain: float = Field(ge=0)
    charter_signed: bool
    appointment_datetime: datetime
    commentaires: str
    dateDebut: datetime
    dateFin: datetime
    documents: Dict[str, Any]

    @field_validator('status')
    def validate_status(cls, v):
        allowed = ['non_démarré', 'en_cours', 'terminé']
        if v not in allowed:
            raise ValueError(f'Status must be one of {allowed}')
        return v

    @field_validator('dateFin')
    def validate_dates(cls, v, values):
        if 'dateDebut' in values and v < values['dateDebut']:
            raise ValueError('La date de fin doit être postérieure à la date de début')
        return v

class AuditDocument(BaseTimeStampModel):
    id: Optional[UUID]
    auditId: UUID
    document_type: str
    file_name: str
    file_path: str

class DossierExpert(BaseTimeStampModel):
    id: Optional[UUID]
    clientId: UUID
    expertId: UUID
    dossierId: UUID
    role: str
    produit_id: UUID
    statut: str
    date_ouverture: datetime

    @field_validator('statut')
    def validate_statut(cls, v):
        allowed = ['ouvert', 'en_cours', 'terminé', 'annulé']
        if v not in allowed:
            raise ValueError(f'Statut must be one of {allowed}')
        return v

class ProduitEligible(BaseTimeStampModel):
    id: Optional[UUID] = None
    nom: str
    description: str
    tauxInteret: float = Field(ge=0)
    montantMax: float = Field(ge=0)
    dureeMax: int = Field(ge=1)
    conditions: Dict[str, Any]

class ClientProduitEligible(BaseTimeStampModel):
    id: Optional[UUID] = None
    clientId: UUID
    produitId: UUID
    statut: str
    tauxFinal: float = Field(ge=0)
    montantFinal: float = Field(ge=0)
    dureeFinale: int = Field(ge=1)

class Simulation(BaseTimeStampModel):
    id: Optional[int] = None
    clientId: UUID
    dateCreation: Optional[datetime] = None
    statut: Optional[str] = None
    Answers: Optional[Dict[str, Any]] = Field(default_factory=dict)
    score: Optional[float] = None
    tempsCompletion: Optional[int] = None
    abandonA: Optional[str] = None
    CheminParcouru: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SimulationResult(BaseTimeStampModel):
    id: Optional[UUID] = None
    clientId: UUID
    produitEligible: str
    tauxInteret: float = Field(ge=0)
    montantMaximal: float = Field(ge=0)
    dureeMaximale: int = Field(ge=1)
    scoreEligibilite: float = Field(ge=0, le=100)
    commentaires: str
    dateSimulation: datetime
    statut: str
    tauxFinal: float = Field(ge=0)
    montantFinal: float = Field(ge=0)
    dureeFinale: float = Field(ge=1)
    expertSelectionné: bool
    dossierTransmis: bool
    dateFin: datetime
    rapportConsulté: bool
    validéPourCloturer: bool
    documents: str

class Specialization(BaseTimeStampModel):
    id: Optional[UUID] = None
    name: str
    description: str
    conditions: Dict[str, Any]
    dureeAverage: int = Field(ge=0)
    tauxSuccess: float = Field(ge=0, le=100)

class StatusUpdateRules(BaseTimeStampModel):
    id: Optional[UUID]
    currentStatus: str
    nextStatus: str
    triggerEvent: str

class Question(BaseTimeStampModel):
    id: Optional[UUID]
    texte: str
    type: str
    ordre: int = Field(ge=0)

class Reponse(BaseTimeStampModel):
    id: Optional[UUID]
    questionId: UUID
    texte: str
    valeur: str

class Notification(BaseTimeStampModel):
    id: Optional[UUID]
    recipientId: UUID
    message: str
    status: str
    type_notification: str
    lu: bool
    dateLecture: Optional[datetime]
    date_notification: datetime

class MissingDocument(BaseTimeStampModel):
    id: Optional[UUID]
    clientId: UUID
    produitId: UUID
    documentType: str
    status: str 