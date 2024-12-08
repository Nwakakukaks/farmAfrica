/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { TokenCardHeader } from "./token-card-header";
import { TokenCardRecords } from "./token-card-records";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";
import { useToast } from "@/components/ui/use-toast";

// Recieves data from the different pages and ties them together
// implement fetching updates record connected to each token from user identity
// implement fetching investment record connected to each token from user identity

interface TokenCardProps {
  token: any;
}

export function TokenCard({ token }: TokenCardProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const { chain } = useNetwork();
  const [storageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });

  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const [currency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });

  useEffect(() => {
    const fetchAllRequests = async () => {
      if (!address) return;

      const selectedCurrency = currencies.get(currency);
      const selectedStorageChain = storageChains.get(storageChain);

      if (!selectedCurrency || !selectedStorageChain) {
        toast({
          variant: "destructive",
          description: "Currency or chain is missing!",
          title: "Chain or currency missing",
        });
        return;
      }

      try {
        setIsLoading(true);

        const requestClient = new RequestNetwork({
          nodeConnectionConfig: {
            baseURL: selectedStorageChain.gateway,
          },
        });

        const identityAddress = address;
        const requests = await requestClient.fromIdentity({
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: identityAddress,
        });

        const filteredRequests = requests
          .map((request) => request.getData())
          .filter((data) => {
            return (
              data?.contentData.type === "Funding-Record" &&
              data?.contentData.identifier === token.contentData.identifier
            );
          });

        setRequests(filteredRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllRequests();
  }, [address]);

  if (isLoading) {
    return (
      <div className="space-y-2 flex flex-col ">
        <Skeleton className="w-full h-20" />
        <Skeleton className="w-full h-20" />
        <Skeleton className="w-full h-20" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center border rounded-2xl px-6 py-8">
      <TokenCardHeader token={token} />
      <Separator className="my-6" />
      <TokenCardRecords token={token} request={requests} />
    </div>
  );
}
