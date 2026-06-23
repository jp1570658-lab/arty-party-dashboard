import { NewEventWizard } from "@/components/events/NewEventWizard";

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink-primary">New event</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          A few details to get started — you can edit everything later.
        </p>
      </div>
      <NewEventWizard />
    </div>
  );
}
