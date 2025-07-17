import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Progress } from "./progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { AlertCircle, User, XCircle, CheckCircle, Calendar, FileText } from "lucide-react";

interface WorkflowStep { id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  documents?: string[] }

interface Workflow { id: string;
  name: string;
  description: string;
  currentStep: WorkflowStep;
  steps: WorkflowStep[];
  participants: string[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string }

interface User { id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'participant' | 'viewer' }

interface CollaborativeWorkflowProps { workflow: Workflow;
  currentUser: User;
  onStepUpdate?: (stepId: string, updates: Partial<WorkflowStep>) => void;
  onWorkflowUpdate?: (updates: Partial<Workflow>) => void }

export const CollaborativeWorkflow: React.FC<CollaborativeWorkflowProps> = ({ workflow, onStepUpdate }) => { const [activeTab, setActiveTab] = useState('overview');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; }
  };

  const getStepStatusIcon = (status: WorkflowStep['status']) => { switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'blocked': return <XCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />; }
  };

  const handleStepClick = (stepId: string) => { setSelectedStep(selectedStep === stepId ? null : stepId); };

  const handleStepStatusChange = (stepId: string, newStatus: WorkflowStep['status']) => { onStepUpdate?.(stepId, { status: newStatus });
  };

  const handleAddParticipant = () => { if (newParticipantEmail.trim()) {
      // TODO: Implémenter l'ajout de participant
      console.log('Ajouter participant: ', newParticipantEmail);
      setNewParticipantEmail('');
      setShowAddParticipant(false); }
  };

  return (
    <div className="space-y-6">
      { /* En-tête du workflow */ }
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{ workflow.name }</CardTitle>
              <p className="text-gray-600 mt-2">{ workflow.description }</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={ workflow.status === 'active' ? 'default' : 'secondary' }>
                { workflow.status }
              </Badge>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                { workflow.participants.length } participants
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      { /* Onglets */ }
      <Tabs value={ activeTab } onValueChange={ setActiveTab }>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="steps">Étapes</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        { /* Vue d'ensemble */ }
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression globale</span>
                    <span>{ Math.round((workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100) }%</span>
                  </div>
                  <Progress value={ (workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100 } />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      { workflow.steps.filter(s => s.status === 'in_progress').length }
                    </div>
                    <div className="text-sm text-gray-600">En cours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      { workflow.steps.filter(s => s.status === 'completed').length }
                    </div>
                    <div className="text-sm text-gray-600">Terminées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      { workflow.steps.filter(s => s.status === 'blocked').length }
                    </div>
                    <div className="text-sm text-gray-600">Bloquées</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        { /* Étapes */ }
        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Étapes du workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                { workflow.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStep === step.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={ () => handleStepClick(step.id) }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                          { index + 1 }
                        </div>
                        <div>
                          <h4 className="font-medium">{ step.name }</h4>
                          <p className="text-sm text-gray-600">{ step.description }</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={ getStepStatusColor(step.status) }>
                          { getStepStatusIcon(step.status) }
                          <span className="ml-1">{ step.status }</span>
                        </Badge>
                        { step.assignedTo && (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {step.assignedTo.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                    
                    { selectedStep === step.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Statut</label>
                            <select
                              value={step.status}
                              onChange={ (e) => handleStepStatusChange(step.id, e.target.value as WorkflowStep['status']) }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="pending">En attente</option>
                              <option value="in_progress">En cours</option>
                              <option value="completed">Terminé</option>
                              <option value="blocked">Bloqué</option>
                            </select>
                          </div>
                          
                          { step.notes && (
                            <div>
                              <label className="text-sm font-medium">Notes</label>
                              <p className="mt-1 text-sm text-gray-600">{step.notes}</p>
                            </div>
                          )}
                          
                          { step.documents && step.documents.length > 0 && (
                            <div>
                              <label className="text-sm font-medium">Documents</label>
                              <div className="mt-1 space-y-1">
                                {step.documents.map((doc, docIndex) => (
                                  <div key={docIndex} className="flex items-center space-x-2 text-sm">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span>{ doc }</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        { /* Participants */ }
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Participants</CardTitle>
                <Button onClick={ () => setShowAddParticipant(true) }>
                  <User className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                { workflow.participants.map((participantId) => (
                  <div key={participantId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>
                          { participantId.charAt(0).toUpperCase() }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{ participantId }</p>
                        <p className="text-sm text-gray-600">Participant</p>
                      </div>
                    </div>
                    <Badge variant="outline">Actif</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        { /* Activité */ }
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">Étape "Validation"</span> marquée comme terminée
                    </p>
                    <p className="text-xs text-gray-500">Il y a 2 heures</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">Nouveau participant</span> ajouté au workflow
                    </p>
                    <p className="text-xs text-gray-500">Il y a 4 heures</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">Étape "Révision"</span> bloquée
                    </p>
                    <p className="text-xs text-gray-500">Il y a 1 jour</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      { /* Modal d'ajout de participant */ }
      { showAddParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Ajouter un participant</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email du participant
                </label>
                <input
                  type="email"
                  value={newParticipantEmail}
                  onChange={ (e) => setNewParticipantEmail(e.target.value) }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="participant@exemple.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={ () => setShowAddParticipant(false) }>
                  Annuler
                </Button>
                <Button onClick={ handleAddParticipant }>
                  Ajouter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 