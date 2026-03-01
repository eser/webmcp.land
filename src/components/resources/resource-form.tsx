"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Globe, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { analyticsResource } from "@/lib/analytics";
import { getResourceUrl } from "@/lib/urls";

const createResourceSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(1, t("resources.titleRequired")).max(200),
  description: z.string().max(2000).optional(),
  endpointUrl: z.string().url(t("resources.endpointUrlRequired")).min(1),
  serverType: z.enum(["MCP", "WEBMCP"]),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()),
  isPrivate: z.boolean(),
});

type ResourceFormValues = z.infer<ReturnType<typeof createResourceSchema>>;

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent?: { id: string; name: string } | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface ResourceFormProps {
  categories: Category[];
  tags: Tag[];
  initialData?: Partial<ResourceFormValues>;
  resourceId?: string;
  mode?: "create" | "edit";
}

export function ResourceForm({
  categories,
  tags,
  initialData,
  resourceId,
  mode = "create",
}: ResourceFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isEdit = mode === "edit";
  const [isLoading, setIsLoading] = useState(false);

  const schema = createResourceSchema(t);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      endpointUrl: initialData?.endpointUrl || "",
      serverType: initialData?.serverType || "WEBMCP",
      categoryId: initialData?.categoryId || "",
      tagIds: initialData?.tagIds || [],
      isPrivate: initialData?.isPrivate || false,
    },
  });

  const selectedTagIds = form.watch("tagIds");
  const serverType = form.watch("serverType");

  const toggleTag = (tagId: string) => {
    const current = form.getValues("tagIds");
    if (current.includes(tagId)) {
      form.setValue("tagIds", current.filter((id) => id !== tagId));
    } else {
      form.setValue("tagIds", [...current, tagId]);
    }
  };

  async function onSubmit(data: ResourceFormValues) {
    setIsLoading(true);

    try {
      const url = isEdit ? `/api/resources/${resourceId}` : "/api/resources";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save resource");
      }

      const result = await response.json();

      if (isEdit) {
        analyticsResource.edit(resourceId!);
        toast.success(t("resources.updateSuccess"));
        router.push(getResourceUrl(resourceId!, result.slug));
      } else {
        analyticsResource.create(result.id, data.serverType);
        toast.success(t("resources.createSuccess"));
        router.push(getResourceUrl(result.id, result.slug));
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resources.title")}</FormLabel>
              <FormControl>
                <Input placeholder={t("resources.titlePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Endpoint URL */}
        <FormField
          control={form.control}
          name="endpointUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resources.endpointUrl")}</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/.well-known/webmcp"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("resources.endpointUrlDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Server Type */}
        <FormField
          control={form.control}
          name="serverType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resources.serverType")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("resources.selectServerType")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="WEBMCP">
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      WebMCP
                    </span>
                  </SelectItem>
                  <SelectItem value="MCP">
                    <span className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      MCP
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {serverType === "WEBMCP"
                  ? t("resources.webmcpDescription")
                  : t("resources.mcpDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resources.description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("resources.descriptionPlaceholder")}
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("resources.descriptionHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resources.category")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("resources.selectCategory")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tagIds"
          render={() => (
            <FormItem>
              <FormLabel>{t("resources.tags")}</FormLabel>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    style={
                      selectedTagIds.includes(tag.id)
                        ? { backgroundColor: tag.color, borderColor: tag.color, color: "white" }
                        : { borderColor: tag.color + "40", color: tag.color }
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Private toggle */}
        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t("resources.private")}</FormLabel>
                <FormDescription>{t("resources.privateDescription")}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? t("resources.update") : t("resources.register")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
