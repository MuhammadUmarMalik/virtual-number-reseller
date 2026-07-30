import { Card, CardContent, CardHeader, CardTitle } from "@number-reseller/ui";

interface FoundationPageProps {
  title: string;
  description: string;
  items?: string[];
}

export function FoundationPage({ title, description, items = [] }: FoundationPageProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-950">Implementation status</p>
            <p className="mt-1 text-sm text-slate-600">
              Route, layout, responsive navigation, and state surface are scaffolded. Domain behavior
              will be connected module by module.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected States</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-slate-600">
            {(items.length ? items : ["Loading", "Empty", "Error", "Success"]).map((item) => (
              <li className="flex items-center gap-2" key={item}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
