/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { TokenExploreList } from "@/components/token-explore-list";
import { Separator } from "@/components/ui/separator";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";
import { useToast } from "@/components/ui/use-toast";

export default function ExplorePage() {
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

        const identityAddress = '0x7128AF8F5AA6abe92b5f9ba9545146027A995B16';
        const requests = await requestClient.fromIdentity({
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: identityAddress,
        });
        const filteredRequests = requests
          .map((request) => request.getData())
          .filter((data) => {
            return data?.contentData.type === "Funding-Request";
          });

        setRequests(filteredRequests);
       
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchAllRequests();
  }, [address]);

  return (
    <div className="container py-10 mx-auto">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Explore</h2>
        <p className="text-muted-foreground">
          Invest in crops and livestock that you like
        </p>
      </div>
      <Separator className="my-6" />
      <div className="w-full flex flex-row gap-6">
        {requests.map((request, index) => (
          <TokenExploreList key={index} requests={request} />
        ))}
      </div>
    </div>
  );
}
