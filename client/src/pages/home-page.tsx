import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profitum</h1>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/services">Services</Link>
            </Button>
            {user ? (
              <Button asChild>
                <Link to={user.type === "client" ? "/dashboard/client" : "/dashboard/partner"}>
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Expert Solutions for Your Business
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect with qualified professionals, get personalized quotes, and schedule appointments all in one place.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </section>

        <section className="bg-primary/5 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Submit Your Request</h3>
                <p className="text-muted-foreground">
                  Describe your needs and requirements for expert consultation
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Receive Quotes</h3>
                <p className="text-muted-foreground">
                  Compare detailed quotes from qualified professionals
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Schedule Appointments</h3>
                <p className="text-muted-foreground">
                  Book and manage appointments with your chosen expert
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}