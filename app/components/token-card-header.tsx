/* eslint-disable @next/next/no-img-element */
"use client";

import { addressToShortAddress } from "@/lib/converters";
import { Progress } from "@/components/ui/progress";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { isAddressEqual, zeroAddress } from "viem";
import { TokenInvestDialog } from "./token-invest-dialog";
import { TokenReturnInvestmentDialog } from "./token-return-investment-dialog";
import { TokenSellDialog } from "./token-sell-dialog";
import { useAccount } from "wagmi";

//showing funding request details

interface TokenCardHeaderProps {
  token: any;
}

export function TokenCardHeader({ token }: TokenCardHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const {
    type,
    category,
    description,
    identifier,
    chain,
    investmentAmount,
    expectedReturnAmount,
    expectedReturnPeriod,
    farmerAddress,
    investorAddress,
    passport,
  } = token.contentData;

  const loadPassportData = () => {
    setIsLoading(false);
  };

  const reputation_score = Math.floor(Math.random() * (100 - 50 + 1)) + 50;

  const isReturnButtonVisible =
    farmerAddress && address && isAddressEqual(farmerAddress, address);

  const isInvestButtonVisible =
    investorAddress === "" &&
    address &&
    farmerAddress &&
    !isAddressEqual(address, farmerAddress);

  const isSellButtonVisible =
    farmerAddress && address && isAddressEqual(farmerAddress, address);

  return (
    <div className="w-full flex flex-row gap-4">
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold">
            {category === "Grains"
              ? "🌾 Grains"
              : category === "Cattle"
              ? "🐄 Cattle"
              : category === "Poultry"
              ? "🐓 Poultry"
              : category === "Coffee"
              ? "☕ Coffee"
              : category}
            {investorAddress === "" ? (
              <span className="font-normal text-primary"> — Available</span>
            ) : (
              <span className="font-normal text-muted-foreground">
                {" "}
                — Closed
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Reputation:</span>
            <Progress
              value={reputation_score}
              className={`w-32 h-2 ${
                reputation_score >= 70
                  ? "bg-green-200 [&>div]:bg-green-500"
                  : reputation_score >= 50
                  ? "bg-yellow-200 [&>div]:bg-yellow-500"
                  : "bg-red-200 [&>div]:bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                reputation_score >= 70
                  ? "text-green-500"
                  : reputation_score >= 50
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            >
              {reputation_score}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Description:</p>
            <p className="text-sm line-clamp-3">{description}</p>
          </div>
          <div className="flex flex-col gap-1 md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Identifier:</p>
            <p className="text-sm break-all">{identifier}</p>
          </div>
          <div className="flex flex-col gap-1 md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Created:</p>
            <p className="text-sm break-all">
              {new Date(token.timestamp * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-center md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Farmer:</p>
            <div className="flex justify-center items-center gap-2">
              <a
                href={`/address/${farmerAddress}`}
                target="_blank"
                className="text-sm break-all underline underline-offset-4"
              >
                {addressToShortAddress(farmerAddress)}
              </a>
              <Dialog onOpenChange={(open) => open && loadPassportData()}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    View ID Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Farmer ID Card</DialogTitle>
                  </DialogHeader>
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : Object.keys(passport).length === 0 ? (
                    <img
                      src="https://utfs.io/f/PKy8oE1GN2J3vJO6NSxAmeTSnXHbfhYk8MFj6RCAl0B3E2pO"
                      className="w-full h-full"
                      alt="ID card"
                    />
                  ) : (
                    <img
                      src={passport}
                      className="w-full h-full"
                      alt="ID card"
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Simplified Chain and Investment Details */}
          <div className="flex flex-col md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Chain:</p>
            <p className="text-sm break-all">{chain}</p>
          </div>
          <div className="flex flex-col md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">
              Required investment:
            </p>
            <p className="text-sm break-all">
              {investmentAmount} {token.currency}
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Expected return:</p>
            <p className="text-sm break-all">
              {expectedReturnAmount} {token.currency}
            </p>
          </div>

          {/* Simple Investor Display */}
          <div className="flex flex-col md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Investor:</p>
            <p className="text-sm break-all">
              {investorAddress === "" ? (
                "None"
              ) : (
                <a
                  href={`/address/${investorAddress}`}
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  {addressToShortAddress(investorAddress)}
                </a>
              )}
            </p>
          </div>

          {isReturnButtonVisible && (
            <TokenReturnInvestmentDialog token={token} onReturn={() => {}} />
          )}
          {isInvestButtonVisible && (
            <TokenInvestDialog token={token} onInvest={() => {}} />
          )}
          {isSellButtonVisible && <TokenSellDialog />}
        </div>
      </div>
    </div>
  );
}
