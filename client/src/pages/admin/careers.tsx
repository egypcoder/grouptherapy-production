import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Career } from "@/lib/database";

export default function AdminCareers() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "full-time",
    description: "",
    requirements: "",
    benefits: "",
    salary: "",
    published: true,
  });

  const { data: careers = [] } = useQuery<Career[]>({
    queryKey: ["careers"],
    queryFn: queryFunctions.careers,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.careers.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careers"] });
      toast({
        title: "Job deleted",
        description: "The job posting has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; career: Partial<Career> }) => {
      if (data.isEdit && data.id) {
        return db.careers.update(data.id, data.career);
      } else {
        return db.careers.create(data.career);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["careers"] });
      toast({
        title: variables.isEdit ? "Job updated" : "Job created",
        description: variables.isEdit ? "The job posting has been updated." : "The job posting has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save job",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (career: Career) => {
    setEditingCareer(career);
    setFormData({
      title: career.title || "",
      department: career.department || "",
      location: career.location || "",
      type: career.type || "full-time",
      description: career.description || "",
      requirements: career.requirements || "",
      benefits: career.benefits || "",
      salary: career.salary || "",
      published: career.published ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this job posting?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const careerData: Partial<Career> = {
      title: formData.title,
      slug,
      department: formData.department,
      location: formData.location,
      type: formData.type,
      description: formData.description,
      requirements: formData.requirements,
      benefits: formData.benefits,
      salary: formData.salary,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingCareer,
      id: editingCareer?.id,
      career: careerData,
    });
  };

  const resetForm = () => {
    setEditingCareer(null);
    setFormData({
      title: "",
      department: "",
      location: "",
      type: "full-time",
      description: "",
      requirements: "",
      benefits: "",
      salary: "",
      published: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Careers</h1>
            <p className="text-muted-foreground">Manage job postings</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Job
          </Button>
        </div>

        <div className="grid gap-4">
          {careers.map((career) => (
            <Card key={career.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{career.title}</h3>
                      {!career.published && <Badge variant="secondary">Draft</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{career.department} · {career.location}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{career.type}</Badge>
                      {career.salary && <Badge variant="outline">{career.salary}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(career)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(career.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {careers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No job postings yet. Add your first job to get started.
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCareer ? "Edit Job" : "Add New Job"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior A&R Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., A&R, Marketing"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., London, UK / Remote"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Employment Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="salary">Salary Range (Optional)</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., $60,000 - $80,000"
                />
              </div>
              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role and responsibilities..."
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="List the required skills and qualifications..."
                />
              </div>
              <div>
                <Label htmlFor="benefits">Benefits (Optional)</Label>
                <Textarea
                  id="benefits"
                  rows={3}
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="List any benefits and perks..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
