import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";

interface CharterDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CharterDialog({ open, onClose }: CharterDialogProps) {
  const [canClose, setCanClose] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setCanClose(true);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Charte d'Engagement Client - Profitum</DialogTitle>
          <DialogDescription>
            Veuillez lire attentivement la charte avant de la fermer.
          </DialogDescription>
        </DialogHeader>

        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="py-6 max-h-[60vh] overflow-y-auto space-y-4"
        >
          <h2 className="text-lg font-semibold">1. Objet de la Charte</h2>
          <p>
            Cette charte définit les engagements réciproques entre Profitum et le Client. Elle régit les conditions générales d'utilisation du service, le respect des règles RGPD, la confidentialité des données et leur utilisation exclusive aux fins des audits réalisés via Profitum.
          </p>
         <h2 className="text-lg font-semibold">1. Objet de la Charte</h2>
          <p>
            Cette charte définit les engagements réciproques entre Profitum et le Client. Elle régit les conditions générales d'utilisation du service, le respect des règles RGPD, la confidentialité des données et leur utilisation exclusive aux fins des audits réalisés via Profitum.
                </p>

                <h2 className="text-lg font-semibold">2. Conditions Générales d’Utilisation</h2>
                <h3 className="font-medium">2.1 Accès aux services</h3>
                <p>Le Client s’engage à fournir des informations exactes et à jour lors de son inscription et de l'utilisation de la plateforme.</p>
                <p>Profitum se réserve le droit de suspendre l’accès en cas d’utilisation abusive ou frauduleuse.</p>

                <h3 className="font-medium">2.2 Responsabilité du Client</h3>
                <p>Le Client est responsable de l’exactitude des documents et informations fournis aux experts partenaires.</p>
                <p>Le Client s’engage à respecter les recommandations des experts et à collaborer activement dans le cadre des audits.</p>

                <h3 className="font-medium">2.3 Responsabilité de Profitum</h3>
                <p>Profitum agit comme une plateforme de mise en relation entre les Clients et les experts et ne peut être tenu responsable des décisions ou recommandations effectuées par les experts.</p>
                <p>Profitum garantit un accès sécurisé à la plateforme et la protection des données fournies.</p>

                <h2 className="text-lg font-semibold">3. Respect des Règles RGPD</h2>
                <h3 className="font-medium">3.1 Protection des données personnelles</h3>
                <p>Profitum collecte et traite les données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).</p>
                <p>Le Client dispose d’un droit d’accès, de modification et de suppression de ses données.</p>
                <p>Les données collectées sont stockées sur des serveurs sécurisés et ne sont accessibles qu’aux personnes autorisées.</p>

                <h3 className="font-medium">3.2 Finalité des traitements</h3>
                <p>Les données sont utilisées exclusivement pour les audits et l’accompagnement du Client.</p>
                <p>Aucun partage ou vente de données à des tiers à des fins commerciales n’est réalisé.</p>
                <p>Profitum s’engage à anonymiser ou supprimer les données après une période définie d’inactivité.</p>

                <h3 className="font-medium">3.3 Consentement et droits du Client</h3>
                <p>En utilisant la plateforme, le Client accepte la collecte et le traitement de ses données selon les conditions décrites.</p>
                <p>Le Client peut retirer son consentement à tout moment et demander la suppression de son compte.</p>

                <h2 className="text-lg font-semibold">4. Engagement de Confidentialité</h2>
                <h3 className="font-medium">4.1 Non-divulgation des informations</h3>
                <p>Profitum s’engage à préserver la confidentialité des données fournies par le Client.</p>
                <p>Les informations partagées avec les experts partenaires sont strictement limitées aux besoins des audits.</p>
                <p>Aucun partage d’informations confidentielles ne sera effectué sans l’accord explicite du Client.</p>

                <h3 className="font-medium">4.2 Sécurisation des échanges</h3>
                <p>Les échanges entre Profitum, les Clients et les experts sont protégés par un protocole de cryptage.</p>
                <p>Toutes les mesures sont mises en place pour éviter tout accès non autorisé aux données sensibles.</p>

                <h2 className="text-lg font-semibold">5. Durée et Résiliation</h2>
                <p>Le Client peut résilier son engagement à tout moment en supprimant son compte et en demandant la suppression de ses données.</p>
                <p>Profitum peut résilier l’accès du Client en cas de non-respect des engagements définis dans cette charte.</p>

                <h2 className="text-lg font-semibold">6. Acceptation de la Charte</h2>
                <p>L’acceptation de cette charte est une condition préalable à l’utilisation de la plateforme Profitum. En validant son inscription, le Client reconnaît avoir lu, compris et accepté l’ensemble des engagements décrits ci-dessus.</p>

                <p className="font-semibold">📩 Contact : Pour toute question relative à cette charte, le Client peut contacter Profitum à l’adresse suivante : <a href="mailto:contact@profitum.fr" className="text-blue-500 underline">contact@profitum.fr</a></p>
        </div>

        <DialogFooter className="flex justify-center">
          <Button onClick={onClose} disabled={!canClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
