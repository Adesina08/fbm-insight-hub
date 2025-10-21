import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface PDFExportButtonProps {
  /**
   * Ref to the element containing the dashboard content that should be printed.
   */
  targetRef: React.RefObject<HTMLElement>;
  /**
   * Optional name that will be suggested when saving to PDF via the print dialog.
   */
  fileName?: string;
  /**
   * Allow parent components to disable the export button while data is loading.
   */
  disabled?: boolean;
}

const PDFExportButton = ({ targetRef, fileName = "behavioural-analysis", disabled = false }: PDFExportButtonProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!targetRef.current) {
      toast({
        title: "Nothing to export",
        description: "The report content is not available yet.",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);

    try {
      const originalTitle = document.title;
      document.title = `${fileName}.pdf`;

      await new Promise((resolve) => setTimeout(resolve, 50));

      window.print();

      toast({
        title: "Export ready",
        description: "Use the browser dialog to save the analysis as a PDF.",
      });

      document.title = originalTitle;
    } catch (error) {
      console.error("Failed to trigger print dialog", error);
      toast({
        title: "Export failed",
        description: "We couldn't open the PDF export dialog. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button onClick={handlePrint} variant="outline" disabled={isPrinting || disabled} className="gap-2">
      {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {isPrinting ? "Preparing…" : "Export PDF"}
    </Button>
  );
};

export default PDFExportButton;

