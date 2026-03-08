"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ConsultationData } from "../wizard";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  dateOfBirth: z.string().optional(),
  genderIdentity: z.string().optional(),
  consentDataProcessing: z.boolean().refine((v) => v === true, "Consent required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  data: ConsultationData;
  onUpdate: (d: Partial<ConsultationData>) => void;
  onNext: () => void;
}

export function Step1Profile({ data, onUpdate, onNext }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: data.firstName ?? "", lastName: data.lastName ?? "" },
  });

  const onSubmit: import("react-hook-form").SubmitHandler<FormData> = (values) => {
    onUpdate({
      firstName: values.firstName,
      lastName: values.lastName,
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
      ...(values.genderIdentity ? { genderIdentity: values.genderIdentity } : {}),
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Client Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Basic information and consent</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input {...register("firstName")} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input {...register("lastName")} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input {...register("dateOfBirth")} type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender Identity</label>
          <select {...register("genderIdentity")} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non_binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input {...register("consentDataProcessing")} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
          <span className="text-sm text-gray-700">
            Client consents to data processing for hair consultation purposes in accordance with GDPR.
            <span className="text-brand ml-1 cursor-pointer hover:underline">View privacy policy</span>
          </span>
        </label>
        {errors.consentDataProcessing && <p className="mt-2 text-xs text-red-500">{errors.consentDataProcessing.message}</p>}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
          Continue →
        </button>
      </div>
    </form>
  );
}
