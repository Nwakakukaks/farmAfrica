import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import {
  payRequest,
  hasSufficientFunds,
  hasErc20Approval,
  approveErc20,
} from "@requestnetwork/payment-processor";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { useEthersV5Signer } from "@/hooks/use-ethers-signer";
import { useEthersV5Provider } from "@/hooks/use-ethers-provider";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";

//Implement payment of request with expected amount

export function TokenInvestDialog(props: {
  token: any;
  onInvest?: () => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { chain } = useNetwork();
  const provider = useEthersV5Provider();
  const signer = useEthersV5Signer();
  const [storageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [currency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });
  const [loading, setLoading] = useState(false);

  const handleRequestAction = async (request: any) => {
    console.log("Starting payTheRequest function");

    if (!address) {
      console.error("Please connect your wallet");
      toast({
        title: "No wallet connected",
        description: " Please connect your wallet",
      });
      return;
    }

    if (!request.requestId) {
      console.error("No request ID found");
      toast({
        title: "Error",
        description: "No request found to pay",
      });
      return;
    }
    const selectedCurrency = currencies.get(currency);
    const selectedStorageChain = storageChains.get(storageChain);

    if (!selectedCurrency || !selectedStorageChain) {
      console.error("Invalid currency or storage chain configuration", {
        currency,
        storageChain,
      });
      toast({
        title: "Configuration Error",
        description: "Invalid currency or storage chain configuration",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      console.log("Setting up signature provider and request client");

      const signatureProvider = new Web3SignatureProvider(walletClient);
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: selectedStorageChain.gateway,
        },
        signatureProvider,
      });

      const myrequest = await requestClient.fromRequestId(request.requestId);
      const requestData = myrequest.getData();

      console.log("Request data retrieved:", {
        network: requestData.currencyInfo.network,
        expectedAmount: requestData.expectedAmount,
        currency: requestData.currency,
      });

      if (!requestData.expectedAmount || requestData.expectedAmount === "0") {
        console.error("Invalid amount for payment");
        toast({
          title: "Payment Error",
          description: "Invalid payment amount",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (requestData.currencyInfo.network !== chain?.network) {
        console.error("Network mismatch", {
          requestNetwork: requestData.currencyInfo.network,
          currentNetwork: chain?.network,
        });
        toast({
          title: "Network Mismatch",
          description: `Please switch to ${requestData.currencyInfo.network}`,
        });
        setLoading(false);
        return;
      }

      console.log("Checking for sufficient funds");
      const hasFunds = await hasSufficientFunds({
        request: requestData,
        address: address!,
        providerOptions: {
          provider: provider,
        },
      });

      if (!hasFunds) {
        console.error("Insufficient funds for the request");
        toast({
          title: "Insufficient Funds",
          description: "You do not have enough funds to pay this request",
        });
        setLoading(false);
        return;
      }

      console.log("Checking ERC20 approval");
      const _hasErc20Approval = await hasErc20Approval(
        requestData,
        address,
        provider
      );
      if (!_hasErc20Approval) {
        console.log("Requesting ERC20 approval");
        const approvalTx = await approveErc20(requestData, signer);
        await approvalTx.wait(2);
        console.log("ERC20 approval transaction completed");
      }

      console.log("Paying the request");
      const paymentTx = await payRequest(requestData, signer);
      await paymentTx.wait(2);

      if (paymentTx.hash) {
        toast({
          title: "Payment Success",
          description: `Payment successful, transaction hash: ${paymentTx.hash}`,
        });
        console.log(`Payment successful, transaction hash: ${paymentTx.hash}`);
      }

      setLoading(false);
    } catch (error) {
      console.error("Comprehensive payment error:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing the payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

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
            Are you sure you want to invest {props.token.contentData.investmentAmount} {''}
             {props.token.currency} in this farm?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="default"
            disabled={loading}
            onClick={ () => handleRequestAction(props.token)}
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Invest
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
