import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import {
  RequestNetwork,
  Types,
  Utils,
} from "@requestnetwork/request-client.js";
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
import { parseUnits, zeroAddress } from "viem";

//Implement returning investment to investor with return amount specified (payment)

export function TokenReturnInvestmentDialog(props: {
  token: any;
  onReturn?: () => void;
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

  const formSchema = z.object({
    value: z.coerce.number().gt(0),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: props.token.contentData.expectedReturnAmount,
    },
  });

  const handleRequestAction = async () => {
    console.log("Starting payTheRequest function");

    if (!address) {
      console.error("Please connect your wallet");
      toast({
        title: "No wallet connected",
        description: " Please connect your wallet",
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

      const requestCreateParameters: Types.ICreateRequestParameters = {
        requestInfo: {
          currency: {
            type: selectedCurrency.type,
            value: selectedCurrency.value,
            network: selectedCurrency.network,
          },
          expectedAmount: parseUnits(
            props.token.contentData.expectedReturnAmount,
            selectedCurrency.decimals
          ).toString(),
          payee: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: props.token.contentData.investorAddress,
          },
          timestamp: Utils.getCurrentTimestampInSecond(),
        },
        paymentNetwork: {
          id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          parameters: {
            paymentNetworkName: selectedCurrency.network,
            paymentAddress: address,
            feeAddress: zeroAddress,
            feeAmount: "0",
          },
        },
        contentData: {
          type: "Return-Investment",
          identifier: props.token.contentData.indentifier,
          farmerAddress: address,
        },
        signer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: address as string,
        },
      };

      const request = await requestClient.createRequest(
        requestCreateParameters
      );
      const confirmedRequestData = await request.waitForConfirmation();

      const myrequest = await requestClient.fromRequestId(
        confirmedRequestData.requestId
      );
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
        address: address,
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
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Return Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Return investment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleRequestAction} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Expected amount to return to the investor
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.1"
                      type="number"
                      step="0.000000000000000001"
                      disabled={loading}
                      readOnly
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Return Investment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
