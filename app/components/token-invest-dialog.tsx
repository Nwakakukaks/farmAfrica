import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

export function TokenInvestDialog(props: {
  token: string;
  tokenInvestmentAmount: string;
  onInvest?: () => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Mocked onSubmit function for simulating an investment
  async function onSubmit() {
    try {
      setIsFormSubmitting(true);
      // Simulate investment logic here (no blockchain interaction)
      console.log("Investment submitted:", props.tokenInvestmentAmount);

      // Simulated success message
      toast({
        title: `Investment of ${props.tokenInvestmentAmount} ETH made 👌`,
      });

      // Simulate the onInvest callback
      props.onInvest?.();

      // Close the dialog after the "investment"
      setIsOpen(false);
    } catch (error) {
      console.error("Error during investment:", error);
      toast({
        title: "Investment failed",
        description: "An error occurred while making the investment.",
        variant: "destructive",
      });
    } finally {
      setIsFormSubmitting(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm">
          Invest
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to invest{" "}
            {props.tokenInvestmentAmount} ETH in this token?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="default"
            disabled={isFormSubmitting}
            onClick={onSubmit}>
            {isFormSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Invest
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
