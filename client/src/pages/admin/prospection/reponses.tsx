/**
 * Page Onglet Réponses - Liste de tous les prospects ayant répondu
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProspectReplies, useRepliesStats, useMarkRepliesRead } from '@/hooks/useProspectReplies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Clock, Mail, Award, Search, Filter, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { RepliesFilters } from '@/types/api';

export default function ReponsesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RepliesFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: replies, isLoading } = useProspectReplies(filters);
  const { data: stats } = useRepliesStats();
  const { mutate: markAsRead } = useMarkRepliesRead();

  // Filtrer par recherche
  const filteredReplies = replies?.filter(reply => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      reply.firstname?.toLowerCase().includes(query) ||
      reply.lastname?.toLowerCase().includes(query) ||
      reply.company_name?.toLowerCase().includes(query) ||
      reply.prospect_email.toLowerCase().includes(query)
    );
  }) || [];

  const handleRowClick = (prospectId: string) => {
    // Marquer comme lu
    markAsRead(prospectId);
    // Naviguer vers le récap
    navigate(`/admin/prospection/sequence-synthese/${prospectId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Réponses
        </h1>
        <p className="text-muted-foreground mt-1">
          Tous les prospects qui ont répondu à vos emails
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réponse</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.response_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_replies || 0} réponses totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_response_time_hours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              {stats?.quick_replies_count || 0} réponses rapides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.replies_this_month || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.replies_this_week || 0} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure Séquence</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">
              {stats?.best_sequence?.sequence_name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.best_sequence?.response_rate || 0}% taux de réponse
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.unread_only ? 'unread' : 'all'}
              onValueChange={(value) => setFilters({
                ...filters,
                unread_only: value === 'unread'
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les réponses</SelectItem>
                <SelectItem value="unread">Non lues uniquement</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.quick_reply_only ? 'quick' : 'all'}
              onValueChange={(value) => setFilters({
                ...filters,
                quick_reply_only: value === 'quick'
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les vitesses</SelectItem>
                <SelectItem value="quick">Réponses rapides</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réponses */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Réponses ({filteredReplies.length})</CardTitle>
          <CardDescription>
            Cliquez sur une ligne pour voir le détail
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredReplies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune réponse trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Début Séquence</TableHead>
                  <TableHead>Emails Envoyés</TableHead>
                  <TableHead>Dernière Réponse</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReplies.map((reply) => (
                  <TableRow
                    key={reply.prospect_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(reply.prospect_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {reply.firstname?.[0]}{reply.lastname?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {reply.firstname} {reply.lastname}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reply.prospect_email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{reply.company_name || '-'}</TableCell>
                    <TableCell>
                      {reply.sequence_start_date 
                        ? new Date(reply.sequence_start_date).toLocaleDateString('fr-FR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reply.emails_sent_before_reply}/{reply.total_emails_sent}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDistanceToNow(new Date(reply.last_reply_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                        {reply.is_quick_reply && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            ⚡ Rapide
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reply.unread_replies > 0 ? (
                        <Badge variant="destructive">
                          {reply.unread_replies} non lu(s)
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Vu</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

