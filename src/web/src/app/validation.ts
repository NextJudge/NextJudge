import { z } from "zod";
import { zfd } from "zod-form-data";

export const newsletterFormSchema = zfd.formData({
  name: zfd.text(z.string().min(3, "Name must be at least 3 characters")),
  email: zfd.text(z.string().email("Invalid email")),
});
