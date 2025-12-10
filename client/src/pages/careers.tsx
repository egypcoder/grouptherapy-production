import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryFunctions } from "@/lib/queryClient";
import type { Career } from "@/lib/database";

export default function CareersPage() {
  const { data: careers = [], isLoading } = useQuery<Career[]>({
    queryKey: ["careersPublished"],
    queryFn: queryFunctions.careersPublished,
  });

  const departments = [...new Set(careers.map((c) => c.department))];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Be part of something special. We're looking for passionate people to help shape the future of electronic music.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : careers.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Open Positions</h2>
              <p className="text-muted-foreground">
                We don't have any open positions at the moment, but check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {departments.map((department) => (
                <div key={department}>
                  <h2 className="text-xl font-semibold mb-4">{department}</h2>
                  <div className="space-y-4">
                    {careers
                      .filter((c) => c.department === department)
                      .map((career, index) => (
                        <motion.div
                          key={career.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold">{career.title}</h3>
                                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {career.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {career.type}
                                    </span>
                                  </div>
                                  {career.salary && (
                                    <Badge variant="secondary" className="mt-2">
                                      {career.salary}
                                    </Badge>
                                  )}
                                </div>
                                <Button className="w-full md:w-auto">
                                  Apply Now <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                              {career.description && (
                                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                                  {career.description}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Why Work With Us?</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-semibold mb-2">Passion for Music</h3>
              <p className="text-sm text-muted-foreground">
                Work with talented artists and be part of the electronic music scene.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold mb-2">Global Impact</h3>
              <p className="text-sm text-muted-foreground">
                Our music reaches millions of listeners worldwide.
              </p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold mb-2">Growth & Learning</h3>
              <p className="text-sm text-muted-foreground">
                Continuous opportunities to grow and develop your skills.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
