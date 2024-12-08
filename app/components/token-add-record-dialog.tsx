"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
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
import { useToast } from "./ui/use-toast";
import { useAccount, useWalletClient } from "wagmi";
import {
  RequestNetwork,
  Types,
  Utils,
} from "@requestnetwork/request-client.js";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { parseUnits, zeroAddress } from "viem";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";

export function TokenAddRecordDialog(props: { token: any }) {
 
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const { address, isDisconnected } = useAccount();
  const [creator, setCreator] = useState(address || "");
  const { data: walletClient } = useWalletClient();
  const [currency, setCurrency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });
  const [storageChain, setStorageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });

  const isValidEthereumAddress = (address: string): boolean => {
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  };

  const validateInputs = () => {
    const errors: string[] = [];
    if (!isValidEthereumAddress(creator))
      errors.push("Invalid creator Ethereum address");
    if (!currency || !currencies.has(currency)) errors.push("Invalid currency");
    if (!storageChain || !storageChains.has(storageChain))
      errors.push("Invalid storage chain");
    return errors;
  };

  const formSchema = z.object({
    value: z.string().min(1),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const validationErrors = validateInputs();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (!walletClient || !address) {
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    const selectedCurrency = currencies.get(currency);
    const selectedStorageChain = storageChains.get(storageChain);

    if (!selectedCurrency || !selectedStorageChain) {
      toast({
        title: "Configuration Error",
        description: "Invalid currency or storage chain configuration",
        variant: "destructive",
      });
      return;
    }

    setIsFormSubmitting(true);

    try {
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
          expectedAmount: parseUnits("1", selectedCurrency.decimals).toString(),
          payee: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: address,
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
          type: "Funding-Record",
          identifier: props.token.contentData.identifier,
          record: values.value,
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

      toast({
        title: "Record Added successfully",
        description: `Record ID: ${confirmedRequestData.requestId}`,
        variant: "default",
      });

      setIsFormSubmitting(false);
      setIsOpen(false);
      return confirmedRequestData.requestId;
    } catch (err) {
      console.error("Error in createRequest:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";

      toast({
        title: "Request Creation Error",
        description: errorMessage,
        variant: "destructive",
      });

      setIsFormSubmitting(false);
      return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-yellow-500 text-black">
          Add Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add a record</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Milestones & Updates</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="I used $30 from the investment funds to get a pickup van for the ranch today"
                      disabled={isFormSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isFormSubmitting}>
                {isFormSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
