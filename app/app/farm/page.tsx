/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { TokenFarmList } from "@/components/token-farm-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function FarmPage() {
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
          variant: 'destructive',
          description: 'Currency or chain is missing!',
          title: 'Chain or currency missing'
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
        const requestDatas = requests.map((request) => request.getData());

        setRequests(requestDatas);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchAllRequests();
  }, [address]);

  return (
    <div className="container py-10">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">My Farm</h2>
        <p className="text-muted-foreground">
          Crops and livestock you tokenized to attract investments
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col items-start gap-6">
        <Link href="/farm/tokens/new">
          <Button>Create Token</Button>
        </Link>
        <div className="w-full flex flex-col gap-6">
          {requests.map((request, index) => (
            <TokenFarmList key={index} requests={request} />
          ))}
        </div>
      </div>
    </div>
  );
}
