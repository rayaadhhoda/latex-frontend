import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { getConfig, updateConfig } from "@/api/client";

const ACCORDION_STEPS = ["provider", "apiKey", "fullName"] as const;
type AccordionStep = (typeof ACCORDION_STEPS)[number];

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PROVIDER_URLS = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  other: "",
} as const;

const formSchema = z.object({
  provider: z.enum(["openai", "openrouter", "other"], {
    message: "Please select an LLM provider.",
  }),
  apiUrl: z.url("Please enter a valid URL."),
  apiKey: z.string().min(1, "API key is required."),
  fullName: z.string().min(2, "Name must be at least 2 characters."),
});

type FormData = z.infer<typeof formSchema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<AccordionStep>("provider");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "openai",
      apiUrl: PROVIDER_URLS.openai,
      apiKey: "",
      fullName: "",
    },
  });

  const provider = form.watch("provider");
  const apiUrl = form.watch("apiUrl");
  const apiUrlDisplay = apiUrl?.replace(/^https?:\/\//, "") || "";

  useEffect(() => {
    if (provider && provider !== "other") {
      form.setValue("apiUrl", PROVIDER_URLS[provider]);
    }
  }, [provider, form]);

  // Fetch existing config on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await getConfig();
        if (response.success && response.data?.config) {
          const config = response.data.config;

          // Derive provider from apiUrl
          let derivedProvider: FormData["provider"] = "other";
          if (config.openai_api_base === PROVIDER_URLS.openai) {
            derivedProvider = "openai";
          } else if (config.openai_api_base === PROVIDER_URLS.openrouter) {
            derivedProvider = "openrouter";
          }

          form.reset({
            provider: derivedProvider,
            apiUrl: config.openai_api_base || PROVIDER_URLS.openai,
            apiKey: config.openai_api_key || "",
            fullName: config.full_name || "",
          });
        }
      } catch {
        // Config not found or error - use defaults
      }
    }
    fetchConfig();
  }, [form]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      await updateConfig({
        openai_api_base: data.apiUrl,
        openai_api_key: data.apiKey,
        full_name: data.fullName,
      });
      navigate("/");
    } catch (error) {
      console.error("Failed to save settings:", error);
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLastStep = currentStep === "fullName";

  async function handleNext() {
    // Validate fields for current step before advancing
    const fieldsToValidate: (keyof FormData)[] =
      currentStep === "provider"
        ? ["provider", "apiUrl"]
        : currentStep === "apiKey"
          ? ["apiKey"]
          : ["fullName"];

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (isLastStep) {
      form.handleSubmit(onSubmit)();
    } else {
      const currentIndex = ACCORDION_STEPS.indexOf(currentStep);
      setCurrentStep(ACCORDION_STEPS[currentIndex + 1]);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen w-fit m-auto">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Document Builder</CardTitle>
          <CardDescription>AI-assisted report writing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To get started, please provide the following information.
          </p>
          <Separator className="my-4" />
          <form id="onboarding-form" onSubmit={form.handleSubmit(onSubmit)}>
            <Accordion
              type="single"
              collapsible
              value={currentStep}
              onValueChange={(value) =>
                setCurrentStep((value as AccordionStep) || currentStep)
              }
            >
              <AccordionItem value="provider">
                <AccordionTrigger>LLM Provider</AccordionTrigger>
                <AccordionContent>
                  <FieldSet>
                    <Controller
                      name="provider"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="provider">Provider</FieldLabel>
                          <Select
                            name={field.name}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              id="provider"
                              aria-invalid={fieldState.invalid}
                              className="w-full"
                            >
                              <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="openrouter">
                                OpenRouter
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FieldDescription>
                            Choose your LLM provider for AI assistance.
                          </FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="apiUrl"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="apiUrl">API URL</FieldLabel>
                          <Input
                            {...field}
                            id="apiUrl"
                            aria-invalid={fieldState.invalid}
                            placeholder="https://api.example.com/v1"
                            autoComplete="off"
                            disabled={provider !== "other"}
                          />
                          <FieldDescription>
                            {provider === "other"
                              ? "Enter your OpenAI-compatible API endpoint."
                              : "API endpoint for the selected provider."}
                          </FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldSet>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="apiKey">
                <AccordionTrigger>API Key</AccordionTrigger>
                <AccordionContent>
                  <Controller
                    name="apiKey"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="apiKey">
                          API Key for {apiUrlDisplay}
                        </FieldLabel>
                        <Input
                          {...field}
                          id="apiKey"
                          type="password"
                          aria-invalid={fieldState.invalid}
                          placeholder="sk-..."
                          autoComplete="off"
                        />
                        <FieldDescription>
                          Your API key will be stored securely.
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="fullName">
                <AccordionTrigger>Your Details</AccordionTrigger>
                <AccordionContent>
                  <Controller
                    name="fullName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                        <Input
                          {...field}
                          id="fullName"
                          aria-invalid={fieldState.invalid}
                          placeholder="Evil Rabbit"
                          autoComplete="off"
                        />
                        <FieldDescription>
                          This lets the AI address you by name.
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setCurrentStep("provider");
            }}
          >
            Reset
          </Button>
          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isLastStep ? "Submit" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
