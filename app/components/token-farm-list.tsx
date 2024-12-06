"use client";

import { useEffect, useMemo } from "react";
import { isAddressEqual, zeroAddress } from "viem";
import { readContracts } from "wagmi";
import EntityList from "./entity-list";
import { TokenCard } from "./token-card";

// show requests for a given farmer

interface TokenFarmProps {
  requests: any;
}

export function TokenFarmList({ requests }: TokenFarmProps) {
  return (
    <EntityList
      entities={requests}
      renderEntityCard={(token, index) => (
        <TokenCard key={index} token={token} />
      )}
      noEntitiesText={`No requests found 😐`}
      className="gap-6"
    />
  );
}
