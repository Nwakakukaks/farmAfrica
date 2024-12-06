"use client";

import { useEffect, useMemo } from "react";
import { isAddressEqual, zeroAddress } from "viem";
import { readContracts } from "wagmi";
import EntityList from "./entity-list";
import { TokenCard } from "./token-card";

//show requests of all farmers

interface TokenExploreProps {
  requests: any;
}

export function TokenExploreList({requests}: TokenExploreProps) {
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
