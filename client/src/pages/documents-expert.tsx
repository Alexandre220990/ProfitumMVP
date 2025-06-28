import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Upload, Search, Trash2 } from "lucide-react";
import HeaderExpert from "@/components/HeaderExpert";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  client: string;
}

export default function DocumentsExpert() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - À remplacer par les données de l'API
  const documents: Document[] = [
    {
      id: "1",
      name: "Rapport d'audit - Client A",
      type: "PDF",
      size: "2.5 MB",
      date: "2024-03-15",
      client: "Client A",
    },
    {
      id: "2",
      name: "Analyse financière - Client B",
      type: "XLSX",
      size: "1.8 MB",
      date: "2024-03-14",
      client: "Client B",
    },
  ];

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderExpert />
      <div className="container mx-auto p-4 pt-24">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Mes Documents</CardTitle>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.client}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>{doc.size}</TableCell>
                    <TableCell>{doc.date}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 