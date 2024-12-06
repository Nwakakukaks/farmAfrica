"use client";

import { useState } from "react";
import { TokenCardHeader } from "./token-card-header";
import { TokenCardRecords } from "./token-card-records";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { FarmTokenMetadata } from "@/types/farm-token-metadata";

const NATIVE_TOKEN_SYMBOL = "ETH";
const DEFAULT_REPUTATION_SCORE = 50;

interface TokenCardProps {
  token: string;
}

export function TokenCard({ token }: TokenCardProps): JSX.Element {
  console.log(token)
  const [tokenOwner, setTokenOwner] = useState<string>("0x1234567890abcdef1234567890abcdef12345678");
  const [tokenParams, setTokenParams] = useState({
    investmentAmount: "1000", // Simulated investment amount
    investor: "0x0000000000000000000000000000000000000000", // Simulated no investor
    returnAmount: "0", // Simulated return amount
    returnDate: "0", // Simulated return date (0 means not returned)
  });
  const [tokenMetadata, setTokenMetadata] = useState<any>({
    category: "Grains",
    description: "A grain token for farming investment",
    identifier: "grain123",
    created: Date.now(),
    expectedReturnAmount: "1200", // Simulated expected return
    expectedReturnPeriod: "6m", // Simulated expected return period
  });

  const reputationScore = DEFAULT_REPUTATION_SCORE; // Simulated reputation score

  // Simulating loading states
  const isLoading = false;  // Set to false as we no longer need to fetch data
  const isTokenMetadataLoading = false;

  if (isLoading || isTokenMetadataLoading) {
    return <Skeleton className="w-full h-8" />;
  }

  if (!tokenOwner || !tokenParams || !tokenMetadata) {
    return <div>Error loading token data</div>;
  }

  const { investmentAmount, investor, returnAmount, returnDate } = tokenParams;
  const finalReputationScore = Number(reputationScore ?? DEFAULT_REPUTATION_SCORE);

  return (
    <div className="w-full flex flex-col items-center border rounded-2xl px-6 py-8">
      <TokenCardHeader
        token={token}
        tokenMetadata={tokenMetadata}
        tokenOwner={tokenOwner}
        tokenInvestmentAmount={investmentAmount}
        tokenInvestmentTokenSymbol={NATIVE_TOKEN_SYMBOL}
        tokenInvestor={investor}
        tokenReturnAmount={returnAmount}
        tokenReturnDate={returnDate}
        reputationScore={finalReputationScore}
        onUpdate={() => {}} 
      />
      <Separator className="my-6" />
      <TokenCardRecords
        token={token}
        tokenMetadata={tokenMetadata}
        tokenOwner={tokenOwner}
        tokenInvestmentTokenSymbol={NATIVE_TOKEN_SYMBOL}
        tokenReturnDate={returnDate}
        onUpdate={() => {}} 
      />
    </div>
  );
}
