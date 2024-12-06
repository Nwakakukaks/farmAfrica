"use client";

import EntityList from "./entity-list";
import { TokenAddRecordDialog } from "./token-add-record-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAccount } from "wagmi";
import { isAddressEqual, zeroAddress } from "viem";
import { FarmTokenMetadata } from "@/types/farm-token-metadata";
import { Button } from "./ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

//implement showcasing request updates from farmer

interface TokenRecordProps {
  token: any;
  request: any;
}

export function TokenCardRecords({ token, request }: TokenRecordProps) {
  const { address } = useAccount();
  const [isExpanded, setIsExpanded] = useState(false);
  const { farmerAddress } = token.contentData;

  const isAddRecordButtonVisible =
    address && isAddressEqual(farmerAddress, address || zeroAddress);

  const handleToggle = () => setIsExpanded(!isExpanded);

  return (
    <div className="w-full border rounded-lg">
      <Button
        variant="ghost"
        className="w-full flex justify-between items-center p-4 hover:bg-secondary/50"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-4">
          <Avatar className="size-10">
            <AvatarImage src="" alt="Icon" />
            <AvatarFallback className="text-base bg-transparent">
              ✍️
            </AvatarFallback>
          </Avatar>
          <p className="text-lg font-bold">Records</p>
        </div>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </Button>

      {isExpanded && (
        <div className="p-4 border-t">
          <EntityList
            entities={request || []}
            renderEntityCard={(record, index) => (
              <TokenCardRecord key={index} records={[record]} />
            )}
            noEntitiesText="No records 😐"
          />
          {isAddRecordButtonVisible && (
            <div className="mt-4">
              <TokenAddRecordDialog token={token} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TokenCardRecord({ records }: any) {
  const sortedRecords = [...records].sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-4">
      {sortedRecords.map((record, index) => (
        <div key={index} className="border-l-2 border-primary pl-4 py-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              {new Date(record.timestamp).toLocaleString()}
            </p>
            <p className="text-base">{record.contentData.record}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
