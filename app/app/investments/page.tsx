/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { TokenInvestmentsList } from "@/components/token-investments-list";
import { Separator } from "@/components/ui/separator";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";
import { useToast } from "@/components/ui/use-toast";

export default function InvestmentsPage() {
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
    const checkRequestCompletion = async (
      requestClient: any, 
      request: any
    ): Promise<boolean> => {
      try {
        const fullRequest = await requestClient.fromRequestId(request.requestId);
        const requestData = fullRequest.getData();

        // Check if the request is fully funded
        return (
          requestData.balance?.balance !== undefined &&
          parseFloat(requestData.balance.balance) >= parseFloat(requestData.expectedAmount)
        );
      } catch (error) {
        console.error(`Error checking request ${request.requestId}:`, error);
        return false;
      }
    };

    const fetchCompletedRequests = async () => {
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
        
        // Filter for funding requests
        const fundingRequests = requests
          .map((request) => request.getData())
          .filter((data: any) => 
            data?.contentData?.type === "Funding-Request"
          );

        // Check and collect completed requests
        const completed: any[] = [];
        for (const request of fundingRequests) {
          const isFullyCompleted = await checkRequestCompletion(requestClient, request);
          if (isFullyCompleted) {
            completed.push(request);
          }
        }

        setRequests(completed);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setIsLoading(false);
      }
    };

    fetchCompletedRequests();
  }, [address]);

  return (
    <div className="container py-10 mx-auto">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">My investments</h2>
        <p className="text-muted-foreground">
          Crops and livestock you invested in.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="w-full flex flex-col gap-6">
        {requests.map((request, index) => (
          <TokenInvestmentsList key={index} requests={request} />
        ))}
      </div>
    </div>
  );
}
