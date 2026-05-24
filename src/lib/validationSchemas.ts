import { z } from "zod";

export const reportSchema = z.object({
  reportType: z.enum([
    "pollution",
    "deforestation",
    "wildlife",
    "climate",
    "water",
    "other"
  ], {
    errorMap: () => ({ message: "Please select a valid report type" })
  }),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters")
    .trim(),
  latitude: z.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  imageFile: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB")
    .refine(
      (file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      "Only JPEG, PNG, and WebP images are allowed"
    )
    .optional()
    .nullable(),
});

export const coordinatesSchema = z.object({
  latitude: z.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

export type ReportFormData = z.infer<typeof reportSchema>;
export type CoordinatesData = z.infer<typeof coordinatesSchema>;
