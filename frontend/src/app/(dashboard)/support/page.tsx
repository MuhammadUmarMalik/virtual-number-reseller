import { Mail, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const SUPPORT_WHATSAPP = "923062617205";
const SUPPORT_EMAIL = "support@numberreseller.com";

const NOTES = [
  {
    title: "US Facebook OTP numbers are available",
    body: "Number Reseller is ready for US Facebook OTP orders. Buy a number, wait for the OTP, and keep it open during the verification window.",
  },
  {
    title: "Resend unlocks after your first OTP",
    body: "The resend option becomes available only after the first OTP arrives on an active order.",
  },
];

const FAQS = [
  {
    question: "What does Number Reseller provide?",
    answer:
      "Number Reseller provides US numbers for receiving Facebook OTP codes during the active order window.",
  },
  {
    question: "When can I request a resend?",
    answer:
      "Resend unlocks only after the first OTP is received, then follows the resend cooldown shown on the order.",
  },
  {
    question: "Do I get a refund if no OTP arrives?",
    answer:
      "Orders without an OTP can be cancelled when the cancel timer is ready, and eligible cancelled orders are refunded to the wallet.",
  },
  {
    question: "How long does a number stay open?",
    answer:
      "Each number stays open for the configured OTP window. Keep the order page open or refresh it to check for new OTPs.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Configured support channels and help content."
      />

      <Card>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">WhatsApp</h2>
            </div>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              +{SUPPORT_WHATSAPP}
            </a>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Email</h2>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {NOTES.map((note) => (
          <Card key={note.title}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="info">Info</Badge>
              <h2 className="font-semibold text-foreground">{note.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{note.body}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-border">
          {FAQS.map((faq) => (
            <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
              <h3 className="font-medium text-foreground">{faq.question}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
