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

interface TokenCardHeaderProps {
  token: string;
  tokenMetadata: any;  
  tokenOwner: any;
  tokenInvestmentAmount: string;
  tokenInvestmentTokenSymbol: string;
  tokenInvestor: any;
  tokenReturnAmount: string;
  tokenReturnDate: string;
  reputationScore: number;
  onUpdate: () => void;
}

export function TokenCardHeader(props: TokenCardHeaderProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);

  // Dummy function to simulate loading passport data (now omitted)
  const loadPassportData = () => {
    setIsLoading(false);  // Simulation: No actual data loading
  };

  return (
    <div className="w-full flex flex-row gap-4">
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold">
            {props.tokenMetadata.category}
            {props.tokenInvestor === "0x0000000000000000000000000000000000000000" && (
              <span className="font-normal text-primary"> — Available</span>
            )}
            {props.tokenReturnDate !== "0" && (
              <span className="font-normal text-muted-foreground">
                {" "}— Closed
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Reputation:</span>
            <Progress
              value={props.reputationScore}
              className={`w-32 h-2 ${
                props.reputationScore >= 70
                  ? "bg-green-200 [&>div]:bg-green-500"
                  : props.reputationScore >= 50
                  ? "bg-yellow-200 [&>div]:bg-yellow-500"
                  : "bg-red-200 [&>div]:bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                props.reputationScore >= 70
                  ? "text-green-500"
                  : props.reputationScore >= 50
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}>
              {props.reputationScore}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Description:</p>
            <p className="text-sm">{props.tokenMetadata.description}</p>
          </div>
          <div className="flex flex-col gap-1 md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Identifier:</p>
            <p className="text-sm break-all">{props.tokenMetadata.identifier}</p>
          </div>
          <div className="flex flex-col gap-1 md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Created:</p>
            <p className="text-sm break-all">
              {new Date(props.tokenMetadata.created || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-center md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Farmer:</p>
            <div className="flex justify-center items-center gap-2">
              <a
                href={`/address/${props.tokenOwner}`}
                target="_blank"
                className="text-sm break-all underline underline-offset-4">
                {addressToShortAddress(props.tokenOwner)}
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
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No ID card data available
                    </p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Simplified Chain and Investment Details */}
          <div className="flex flex-col md:flex-row md:gap-3">
            {/* <p className="text-sm text-muted-foreground">Chain:</p>
            <p className="text-sm break-all">{props.contracts.chain.name}</p> */}
          </div>
          <div className="flex flex-col md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Required investment:</p>
            <p className="text-sm break-all">
              {props.tokenInvestmentAmount} {props.tokenInvestmentTokenSymbol}
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Expected return:</p>
            <p className="text-sm break-all">
              {props.tokenMetadata.expectedReturnAmount}{" "}
              {props.tokenInvestmentTokenSymbol}
            </p>
          </div>

          {/* Simple Investor Display */}
          <div className="flex flex-col md:flex-row md:gap-3">
            <p className="text-sm text-muted-foreground">Investor:</p>
            <p className="text-sm break-all">
              {props.tokenInvestor === "0x0000000000000000000000000000000000000000" ? (
                "None"
              ) : (
                <a
                  href={`/address/${props.tokenInvestor}`}
                  target="_blank"
                  className="underline underline-offset-4">
                  {addressToShortAddress(props.tokenInvestor)}
                </a>
              )}
            </p>
          </div>

          {/* Optional: Remove investment, return buttons for simplicity */}
        </div>
      </div>
    </div>
  );
}
