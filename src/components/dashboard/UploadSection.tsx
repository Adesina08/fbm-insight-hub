import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import SheetMetadataCard from "./SheetMetadataCard";

const UploadSection = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Survey data processed successfully", {
        description: `${file.name} - 1,247 respondents loaded`
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Survey Data</CardTitle>
          <CardDescription>
            Upload Excel files containing Behaviour360 survey responses for automatic processing and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Zone */}
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Upload Survey File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your Excel file here, or click to browse
                </p>
                <label htmlFor="file-upload">
                  <Button variant="default" disabled={isProcessing} asChild>
                    <span className="cursor-pointer">
                      {isProcessing ? "Processing..." : "Select File"}
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: .xlsx, .xls
                </p>
              </div>
            </div>
          </div>

          {/* Expected Data Structure */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Required Columns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium">Demographics (A1-A12):</span> State, LGA, Location, Gender, Age, Marital Status, Education, Religion, Employment, Occupation, Media Access
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium">Knowledge (B1-B3):</span> Heard about contraception, Currently using, Method type
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium">Motivation (C1-C4):</span> Personal desire (1-5), Benefit belief (1-5), Enjoyment (1-5), Social acceptance (1-5)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium">Ability (D1-D6):</span> Ease of finding (1-5), Affordability (1-5), Physical ease (1-5), Mental ease (1-5), Routine fit (1-5), Confidence (1-5)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium">Prompts (E1-E2):</span> Source of prompts (health worker, partner, media, leaders), Likelihood to act (1-5)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium">Norms (F1-F2):</span> Community commonality (1-5), Approval perception (1-4)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium">System (G1-G3):</span> Facility reliability (1-5), Provider respect (1-5), Access ease (1-5)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Automatic Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Upon upload, the system automatically:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span>1.</span>
                      <span>Validates column structure and data types</span>
                    </li>
                    <li className="flex gap-2">
                      <span>2.</span>
                      <span>Creates binary outcome (B2: 1=Yes, 2=No → 1/0)</span>
                    </li>
                    <li className="flex gap-2">
                      <span>3.</span>
                      <span>Computes Motivation (mean C1-C4), Ability (mean D1-D6), Norms (F1, F2 recoded), System (mean G1-G3)</span>
                    </li>
                    <li className="flex gap-2">
                      <span>4.</span>
                      <span>Assigns FBM quadrants (High/Low M × A)</span>
                    </li>
                    <li className="flex gap-2">
                      <span>5.</span>
                      <span>Runs cluster analysis & logistic regression</span>
                    </li>
                    <li className="flex gap-2">
                      <span>6.</span>
                      <span>Updates all visualizations in real-time</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sample Template */}
          <div className="p-4 rounded-lg border bg-info/5 border-info/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-info mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Need a template?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Download the Excel template with correct column headers and example data formatting.
                </p>
                <Button variant="outline" size="sm">
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* Backend Integration Note */}
          <div className="p-4 rounded-lg border bg-primary/5 border-primary/30">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Backend Integration Ready</h4>
                <p className="text-sm text-muted-foreground">
                  This interface is designed to connect with a Python backend (FastAPI) for data processing, 
                  or can be integrated with Lovable Cloud for serverless data handling. The frontend is 
                  ready - just add your backend endpoint to enable real-time survey processing.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <SheetMetadataCard />
    </div>
  );
};

export default UploadSection;
