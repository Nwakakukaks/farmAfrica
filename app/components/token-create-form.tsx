"use client";

import { siteConfig } from "@/config/site";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAccount, useWalletClient } from "wagmi";
import {
  RequestNetwork,
  Types,
  Utils,
} from "@requestnetwork/request-client.js";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { parseUnits, zeroAddress } from "viem";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";
import axios from "axios";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const CLOUD_NAME = "your_cloud_name";
const UPLOAD_PRESET = "your_upload_preset";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

const uploadToCloudinary = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("resource_type", "raw");

    const response = await axios.post(CLOUDINARY_URL, formData);
    return response.data.url;
  } catch (error) {
    throw new Error("Failed to upload attachment to Cloudinary");
  }
};

export function TokenCreateForm() {
  const { address, isDisconnected } = useAccount();
  const [creator, setCreator] = useState(address || "");
  const [payee, setPayee] = useState(address || "");
  const { data: walletClient } = useWalletClient();
  const [currency, setCurrency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });
  const [storageChain, setStorageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });

  const isValidEthereumAddress = (address: string): boolean => {
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  };

  const validateInputs = () => {
    const errors: string[] = [];
    if (!isValidEthereumAddress(creator))
      errors.push("Invalid creator Ethereum address");
    if (!isValidEthereumAddress(payee))
      errors.push("Invalid payee Ethereum address");
    if (!currency || !currencies.has(currency)) errors.push("Invalid currency");
    if (!storageChain || !storageChains.has(storageChain))
      errors.push("Invalid storage chain");
    return errors;
  };

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const formSchema = z.object({
    category: z.string(),
    description: z.string().min(1),
    identifier: z.string().min(1),
    chain: z.string(),
    currency: z.string(),
    investmentAmount: z.coerce.number().gt(0),
    expectedReturnAmount: z.coerce.number().gt(0),
    expectedReturnPeriod: z.string(),
    passport: z
      .any()
      .refine((files) => files?.length === 1, "Passport image is required.")
      .refine(
        (files) => files?.[0]?.size <= MAX_FILE_SIZE,
        "Max file size is 5MB."
      )
      .refine(
        (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        "Only .jpg, .jpeg, .png formats are supported."
      ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: undefined,
      description: "",
      identifier: "",
      chain: storageChain, 
      currency: currency,
      investmentAmount: 0,
      expectedReturnAmount: 0,
      expectedReturnPeriod: undefined,
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const validationErrors = validateInputs();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (!walletClient || !address) {
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    const selectedCurrency = currencies.get(currency);
    const selectedStorageChain = storageChains.get(storageChain);

    if (!selectedCurrency || !selectedStorageChain) {
      toast({
        title: "Configuration Error",
        description: "Invalid currency or storage chain configuration",
        variant: "destructive",
      });
      return;
    }

    setIsFormSubmitting(true);

    try {
      const signatureProvider = new Web3SignatureProvider(walletClient);
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: selectedStorageChain.gateway,
        },
        signatureProvider,
      });

      const requestCreateParameters: Types.ICreateRequestParameters = {
        requestInfo: {
          currency: {
            type: selectedCurrency.type,
            value: selectedCurrency.value,
            network: selectedCurrency.network,
          },
          expectedAmount: parseUnits(
            values.investmentAmount.toString(),
            selectedCurrency.decimals
          ).toString(),
          payee: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: address,
          },

          timestamp: Utils.getCurrentTimestampInSecond(),
        },
        paymentNetwork: {
          id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          parameters: {
            paymentNetworkName: selectedCurrency.network,
            paymentAddress: address,
            feeAddress: zeroAddress,
            feeAmount: "0",
          },
        },
        contentData: {
          type: "Funding-Request", 
          category: values.category,
          description: values.description,
          identifier: values.identifier,
          chain: values.chain,
          investmentAmount: values.investmentAmount,
          expectedReturnAmount: values.expectedReturnAmount.toString(),
          expectedReturnPeriod: values.expectedReturnPeriod,
          passport: values.passport[0], 
          farmerAddress: address,
          investorAddress: '',
        },
        signer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: address as string,
        },
      };

      const request = await requestClient.createRequest(
        requestCreateParameters
      );
      const confirmedRequestData = await request.waitForConfirmation();

      toast({
        title: "Request Created",
        description: `Request ID: ${confirmedRequestData.requestId}`,
        variant: "default",
      });

      setIsFormSubmitting(false);
      return confirmedRequestData.requestId;
    } catch (err) {
      console.error("Error in createRequest:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";

      toast({
        title: "Request Creation Error",
        description: errorMessage,
        variant: "destructive",
      });

      setIsFormSubmitting(false);
      return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isFormSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cattle">🐂 Cattle</SelectItem>
                  <SelectItem value="Grains">🌾 Grains</SelectItem>
                  <SelectItem value="Poultry">🐔 Poultry</SelectItem>
                  <SelectItem value="Coffee">☕ Coffee</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="An Aberdeen Angus calf from a farm located in Spain, Province of Cáceres..."
                  disabled={isFormSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farmer ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="142..."
                  disabled={isFormSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select
                onValueChange={(value) => {
                  setCurrency(value); 
                  field.onChange(value);
                }}
                value={currency} 
                disabled={isFormSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from(currencies.keys()).map((currencyKey, index) => (
                    <SelectItem key={index} value={currencyKey}>
                      {currencies.get(currencyKey)?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chain</FormLabel>
              <Select
                onValueChange={(value) => {
                  setStorageChain(value); 
                  field.onChange(value); 
                }}
                value={storageChain} 
                disabled={isFormSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from(storageChains.keys()).map((chainKey, index) => (
                    <SelectItem key={index} value={chainKey}>
                      {storageChains.get(chainKey)?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passport"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Passport Image (JPG only)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".jpg,.jpeg"
                    disabled={isFormSubmitting}
                    onChange={(e) => onChange(e.target.files)}
                    {...field}
                  />
                  {value?.[0] && (
                    <p className="text-sm text-muted-foreground">
                      {value[0].name}
                    </p>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="investmentAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required investment amount</FormLabel>
              <FormControl>
                <Input
                  placeholder="320"
                  type="number"
                  disabled={isFormSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expectedReturnAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected return amount</FormLabel>
              <FormControl>
                <Input
                  placeholder="480"
                  type="number"
                  disabled={isFormSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expectedReturnPeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected return period</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isFormSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1m">1 month</SelectItem>
                  <SelectItem value="3m">3 months</SelectItem>
                  <SelectItem value="6m">6 months</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isFormSubmitting}>
          {isFormSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create
        </Button>
      </form>
    </Form>
  );
}
