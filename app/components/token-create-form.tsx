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

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg"];

export function TokenCreateForm() {
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const formSchema = z.object({
    category: z.string(),
    description: z.string().min(1),
    identifier: z.string().min(1),
    chain: z.string(),
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
        "Only .jpg, .jpeg formats are supported."
      ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: undefined,
      description: "",
      identifier: "",
      chain: undefined,
      investmentAmount: 0,
      expectedReturnAmount: 0,
      expectedReturnPeriod: undefined,
    },
  });

  // Just a dummy submit function (no smart contract interaction)
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsFormSubmitting(true);

      // Simulating form submission (this part would be replaced with actual logic)
      console.log("Form submitted with values:", values);
      
      // Reset form and show success message
      form.reset();
      alert("Token created successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsFormSubmitting(false);
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
                disabled={isFormSubmitting}>
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
              <FormLabel>Identifier</FormLabel>
              <FormControl>
                <Input
                  placeholder="42..."
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
          name="chain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chain</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isFormSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chain" />
                  </SelectTrigger>
                </FormControl>
                {/* <SelectContent>
                  {Object.values(siteConfig.contracts).map(
                    (contracts, index) => (
                      <SelectItem
                        key={index}
                        value={contracts.chain.id.toString()}>
                        {contracts.chain.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent> */}
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
                disabled={isFormSubmitting}>
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
