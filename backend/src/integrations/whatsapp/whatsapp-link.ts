export function buildWhatsappLink(phoneNumber: string, message: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
