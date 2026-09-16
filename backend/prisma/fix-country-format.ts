import { PrismaClient } from "@prisma/client";
import { smsbowerClient } from "../src/integrations/vendor/smsbower/smsbower.client.js";

const prisma = new PrismaClient();

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  america: "United States",
  "u.s.a": "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "u.k": "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  "u.a.e": "United Arab Emirates",
  "south korea": "South Korea",
  "korea south": "South Korea",
  "russia": "Russia",
  "czech republic": "Czech Republic",
  czechia: "Czech Republic",
  "ivory coast": "Cote D'Ivoire",
  "cote d ivoire": "Cote D'Ivoire",
  "sri lanka": "Sri Lanka",
  "dominican republic": "Dominican Republic",
};

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNumeric(value: string | null | undefined): boolean {
  return /^\d+$/.test((value ?? "").trim());
}

interface CountryResolver {
  idToName: Map<string, string>;
  nameToId: Map<string, string>;
}

function buildResolver(countries: Array<{ id: number; name: string }>): CountryResolver {
  const idToName = new Map<string, string>();
  const nameToId = new Map<string, string>();
  for (const c of countries) {
    idToName.set(c.id.toString(), c.name);
    const key = normalizeName(c.name);
    if (!nameToId.has(key)) nameToId.set(key, c.id.toString());
  }
  return { idToName, nameToId };
}

function resolveCountryId(
  resolver: CountryResolver,
  countryName: string,
  countryCode: string | null,
  vendorCountryId: string | null
): { id: string; name: string } | null {
  const candidates: string[] = [vendorCountryId ?? "", countryCode ?? "", countryName];
  for (const raw of candidates) {
    const value = raw.trim();
    if (isNumeric(value)) {
      const name = resolver.idToName.get(value);
      if (name) return { id: value, name };
    }
  }

  for (const raw of candidates) {
    const alias = COUNTRY_ALIASES[normalizeName(raw)];
    const key = normalizeName(alias ?? raw);
    const id = resolver.nameToId.get(key);
    if (id) return { id, name: resolver.idToName.get(id) ?? raw };
  }

  return null;
}

function looksLikeDialCode(value: string | null | undefined): boolean {
  return /^\+[0-9]{1,4}$/.test((value ?? "").trim());
}

async function main() {
  const countries = await smsbowerClient.getCountries();
  const resolver = buildResolver(
    countries.map((c) => ({ id: c.id, name: c.eng }))
  );
  console.log(`Loaded ${countries.length} SMSBower countries.`);

  const products = await prisma.product.findMany({
    where: { vendor: "SMSBOWER" },
    orderBy: { createdAt: "asc" },
  });

  let fixed = 0;
  let flagged = 0;

  for (const product of products) {
    const resolved = resolveCountryId(
      resolver,
      product.country,
      product.countryCode,
      product.vendorCountryId
    );

    if (!resolved) {
      await prisma.product.update({
        where: { id: product.id },
        data: { needsSync: true, vendorCountryId: null },
      });
      flagged += 1;
      console.log(
        `FLAG  ${product.name} | country="${product.country}" code="${product.countryCode}" -> needs re-sync`
      );
      continue;
    }

    const oldCode = product.countryCode?.trim() ?? "";
    const dialCode = looksLikeDialCode(oldCode) ? oldCode : product.countryDialCode ?? null;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        vendorCountryId: resolved.id,
        countryCode: resolved.id,
        country: resolved.name,
        countryDialCode: dialCode,
        needsSync: false,
      },
    });
    fixed += 1;
    console.log(
      `FIX   ${product.name} | "${product.country}"/"${product.countryCode}" -> vendorCountryId=${resolved.id} country="${resolved.name}" dial="${dialCode ?? ""}"`
    );
  }

  console.log(`\nDone. fixed=${fixed} flagged=${flagged}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
